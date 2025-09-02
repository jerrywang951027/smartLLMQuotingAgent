const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { AgentExecutor, createOpenAIFunctionsAgent, createReactAgent } = require('langchain/agents');
const { PromptTemplate } = require('@langchain/core/prompts');
const { DynamicStructuredTool } = require('@langchain/core/tools');
const llmService = require('./llmService');
const mcpService = require('./mcpService');

class AgentService {
  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  async initializeAgents() {
    try {
      const availableModels = llmService.getAvailableModels();
      
      if (availableModels.length === 0) {
        console.log('No LLM models available - please set API keys in .env file');
        return;
      }
      
      for (const model of availableModels) {
        const agent = await this.createAgent(model.id);
        if (agent === null) {
          console.log(`Skipping ${model.id} due to agent creation failure`);
        }
      }
      
      console.log(`Initialized ${this.agents.size} agents`);
    } catch (error) {
      console.error('Error initializing agents:', error);
    }
  }

  async createAgent(provider) {
    try {
      console.log(`Creating agent for provider: ${provider}`);
      const llm = this.createLLMInstance(provider);
      console.log(`LLM instance created for ${provider}:`, llm.constructor.name);
      
      const tools = await this.createTools();
      console.log(`Tools created for ${provider}:`, tools.length);
      
      const prompt = this.createPrompt();
      console.log(`Prompt created for ${provider}`);
      
      // Try to create agent with error handling
      let agent;
      try {
        if (provider === 'openai') {
          agent = await createOpenAIFunctionsAgent({
            llm,
            tools,
            prompt
          });
        } else {
          // For Google and Anthropic, use ReAct agent which is more compatible
          agent = await createReactAgent({
            llm,
            tools,
            prompt
          });
        }
        console.log(`Agent created for ${provider}`);
      } catch (error) {
        console.error(`Failed to create agent for ${provider}:`, error.message);
        // Skip this provider if agent creation fails
        return null;
      }

      const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: true,
        maxIterations: 5
      });
      console.log(`Agent executor created for ${provider}`);

      this.agents.set(provider, agentExecutor);
      console.log(`✅ Agent successfully created and stored for provider: ${provider}`);
      
    } catch (error) {
      console.error(`❌ Failed to create agent for ${provider}:`, error);
      console.error(`Error details:`, error.stack);
    }
  }

    createLLMInstance(provider) {
    // Use the models directly from llmService
    try {
      return llmService.getModel(provider);
    } catch (error) {
      console.error(`Error getting model for ${provider}:`, error);
      throw error;
    }
  }

  async createTools() {
    const mcpTools = mcpService.getAvailableTools();
    
    const tools = mcpTools.map(tool => {
      return new DynamicStructuredTool({
        name: tool.id,
        description: tool.description,
        schema: tool.parameters,
        func: async (input) => {
          try {
            const result = await mcpService.invokeTool(tool.id, input);
            return JSON.stringify(result);
          } catch (error) {
            return `Error invoking tool ${tool.name}: ${error.message}`;
          }
        }
      });
    });

    // Add a simple weather tool
    const weatherTool = new DynamicStructuredTool({
      name: 'get_weather',
      description: 'Get current weather information for a specific city using wttr.in API',
      schema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'The city name to get weather for (e.g., "Toronto", "New York", "London")'
          }
        },
        required: ['city'],
        additionalProperties: false
      },
      func: async ({ city, location }) => {
        try {
          const cityName = city || location;
          const https = require('https');
          const url = `https://wttr.in/${encodeURIComponent(cityName)}?format=j1`;
          
          return new Promise((resolve, reject) => {
            https.get(url, (res) => {
              let data = '';
              res.on('data', (chunk) => data += chunk);
              res.on('end', () => {
                try {
                  const weatherData = JSON.parse(data);
                  const current = weatherData.current_condition[0];
                  const location = weatherData.nearest_area[0];
                  
                  const result = {
                    location: `${location.areaName[0].value}, ${location.country[0].value}`,
                    temperature: `${current.temp_C}°C (${current.temp_F}°F)`,
                    condition: current.weatherDesc[0].value,
                    humidity: `${current.humidity}%`,
                    windSpeed: `${current.windspeedKmph} km/h`,
                    windDirection: current.winddir16Point,
                    pressure: `${current.pressure} mb`,
                    visibility: `${current.visibility} km`,
                    uvIndex: current.uvIndex,
                    feelsLike: `${current.FeelsLikeC}°C (${current.FeelsLikeF}°F)`
                  };
                  
                  resolve(JSON.stringify(result, null, 2));
                } catch (parseError) {
                  resolve(`Error parsing weather data: ${parseError.message}`);
                }
              });
            }).on('error', (error) => {
              resolve(`Error fetching weather data: ${error.message}`);
            });
          });
        } catch (error) {
          return `Error getting weather for ${cityName}: ${error.message}`;
        }
      }
    });

    tools.push(weatherTool);
    return tools;
  }

  createPrompt() {
    return PromptTemplate.fromTemplate(`
You are an intelligent AI agent with access to various tools through MCP (Model Context Protocol) servers.

Your capabilities include:
- Reasoning about user requests
- Selecting appropriate tools to accomplish tasks
- Executing tools with proper parameters
- Providing clear explanations of your actions

Available tools:
{tool_names}

Tool descriptions:
{tools}

When a user asks you to do something:
1. Think about what tools might be needed
2. Use the appropriate tools to gather information or perform actions
3. Explain what you're doing and why
4. Provide a comprehensive response based on the results

Current conversation:
{chat_history}

User: {input}
{agent_scratchpad}
`);
  }

  async processMessage(provider, message, chatHistory = []) {
    try {
      const agent = this.agents.get(provider);
      if (!agent) {
        // Demo mode - provide a helpful response when no agents are available
        if (this.agents.size === 0) {
          return {
            success: true,
            response: `I'm currently in demo mode. To use the full AI agent capabilities, please set up your API keys in the .env file:

**Required API Keys:**
- OPENAI_API_KEY for GPT-4
- ANTHROPIC_API_KEY for Claude
- GOOGLE_API_KEY for Gemini

**Your message:** "${message}"

Once you add the API keys and restart the server, I'll be able to process your requests using the selected AI model and available MCP tools.`,
            reasoning: [],
            toolsUsed: [],
            provider: 'demo',
            timestamp: new Date().toISOString()
          };
        }
        
        throw new Error(`Agent not available for provider: ${provider}`);
      }

      // Prepare the input for the agent
      const input = {
        input: message,
        chat_history: chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
        tools: await this.getToolDescriptions()
      };

      console.log(`Processing message with ${provider} agent:`, message);
      console.log('Agent available:', !!agent);
      console.log('Tools available:', await this.getToolDescriptions());
      
              try {
          // Execute the agent
          const result = await agent.invoke(input);

          // Log initial LLM response with tool execution request
          console.log('Initial LLM response with tool execution request:', {
            provider,
            response: result.output,
            timestamp: new Date().toISOString()
          });

          // Check if the response contains tool calls that need to be executed
          console.log('Checking for tool calls in result.output:', result.output);
          const toolResult = await this.executeToolsFromResponse(result.output, provider, message, chatHistory);
          console.log('Tool result:', toolResult);
          if (toolResult) {
            return {
              success: true,
              response: toolResult.response,
              reasoning: toolResult.reasoning || [],
              toolsUsed: toolResult.toolsUsed || [],
              provider,
              timestamp: new Date().toISOString()
            };
          }

          return {
            success: true,
            response: result.output,
            reasoning: result.intermediateSteps || [],
            toolsUsed: this.extractToolsUsed(result.intermediateSteps || []),
            provider,
            timestamp: new Date().toISOString()
          };
        } catch (agentError) {
        console.error(`Error processing message with ${provider}:`, agentError);
        
        // If it's a parsing error, try to extract the LLM response from the error
        if (agentError.message && agentError.message.includes('Could not parse LLM output')) {
          const llmResponse = agentError.message.split('Could not parse LLM output: ')[1];
          if (llmResponse) {
            // Try to execute tools if the response contains tool calls
            const toolResult = await this.executeToolsFromResponse(llmResponse.trim(), provider, message, chatHistory);
            if (toolResult) {
              return {
                success: true,
                response: toolResult.response,
                reasoning: toolResult.reasoning || [],
                toolsUsed: toolResult.toolsUsed || [],
                provider,
                timestamp: new Date().toISOString()
              };
            }
            
            return {
              success: true,
              response: llmResponse.trim(),
              reasoning: [],
              toolsUsed: [],
              provider,
              timestamp: new Date().toISOString()
            };
          }
        }
        
        // For other errors, return a helpful message
        return {
          success: false,
          error: `Agent execution failed: ${agentError.message}`,
          provider,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error(`Error processing message with ${provider}:`, error);
      
      // Provide more helpful error messages for common issues
      let errorMessage = error.message;
      if (error.message.includes('gemini-pro is not found')) {
        errorMessage = 'The Gemini model "gemini-pro" is deprecated. Please update to use "gemini-1.5-pro" or "gemini-1.5-flash".';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API key issue detected. Please check your .env file configuration.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Model not found or API endpoint issue. Please check the model name and API configuration.';
      }
      
      return {
        success: false,
        error: errorMessage,
        provider,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getToolDescriptions() {
    const tools = mcpService.getAvailableTools();
    return tools.map(tool => 
      `- ${tool.name}: ${tool.description} (Server: ${tool.serverId})`
    ).join('\n');
  }

  extractToolsUsed(intermediateSteps) {
    return intermediateSteps
      .filter(step => step.action && step.action.tool)
      .map(step => ({
        tool: step.action.tool,
        input: step.action.toolInput,
        output: step.observation
      }));
  }

  async executeToolsFromResponse(response, provider, originalMessage, chatHistory = []) {
    try {
      console.log('Checking response for tool calls:', response);
      
      // Look for tool calls in the response
      const toolCallRegex = /```tool_code\s*\n([^`]+?)\n```/gs;
      const toolCalls = [];
      let match;
      
      while ((match = toolCallRegex.exec(response)) !== null) {
        const toolCall = match[1].trim();
        toolCalls.push(toolCall);
      }
      
      console.log('Found tool calls:', toolCalls);
      
      if (toolCalls.length === 0) {
        console.log('No tool calls found, returning null');
        return null;
      }
      
      const toolsUsed = [];
      const toolResults = [];
      
      // Execute each tool call
      for (const toolCall of toolCalls) {
        try {
          // Parse the tool call (e.g., "get_weather(location=\"Toronto\")")
          const toolMatch = toolCall.match(/(\w+)\((.*)\)/);
          if (toolMatch) {
            const toolName = toolMatch[1];
            const paramsStr = toolMatch[2];
            
            // Parse parameters
            const params = {};
            if (paramsStr) {
              // Simple parameter parsing for key="value" format
              const paramRegex = /(\w+)="([^"]+)"/g;
              let paramMatch;
              while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
                params[paramMatch[1]] = paramMatch[2];
              }
            }
            
            console.log(`Executing tool: ${toolName} with params:`, params);
            
            // Get the tool and execute it
            const tools = await this.createTools();
            const tool = tools.find(t => t.name === toolName);
            
            if (tool) {
              const result = await tool.func(params);
              toolsUsed.push({
                tool: toolName,
                input: params,
                output: result
              });
              
              toolResults.push({
                tool: toolName,
                result: result
              });
              
              console.log(`Tool ${toolName} executed successfully:`, result);
            } else {
              console.log(`Tool ${toolName} not found`);
              toolResults.push({
                tool: toolName,
                result: `Tool ${toolName} not found`
              });
            }
          }
        } catch (toolError) {
          console.error(`Error executing tool call ${toolCall}:`, toolError);
          toolResults.push({
            tool: 'unknown',
            result: `Error executing tool: ${toolError.message}`
          });
        }
      }
      
      // Send tool results back to LLM for processing
      const toolResultsText = toolResults.map(tr => 
        `Tool: ${tr.tool}\nResult: ${tr.result}`
      ).join('\n\n');
      
      const followUpMessage = `I executed the following tools and got these results:\n\n${toolResultsText}\n\nPlease provide a natural response to the user based on these tool results.`;
      
      console.log('Sending tool results to LLM for processing...');
      
      // Get the LLM model for the provider
      const llmService = require('./llmService');
      const llm = llmService.getModel(provider);
      
      if (!llm) {
        console.error(`No LLM model found for provider: ${provider}`);
        return {
          response: response,
          toolsUsed: toolsUsed,
          reasoning: [`Executed ${toolsUsed.length} tool(s) but couldn't process results`]
        };
      }
      
      // Create a new conversation context with tool results
      const updatedChatHistory = [
        ...chatHistory,
        { role: 'user', content: originalMessage },
        { role: 'assistant', content: response },
        { role: 'user', content: followUpMessage }
      ];
      
      // Get LLM response with tool results
      let llmResponse;
      try {
        // Create a context-aware prompt that includes the original question and tool results
        const contextPrompt = `Original user question: "${originalMessage}"

I executed the following tools and got these results:

${toolResultsText}

Please provide a natural, helpful response to the user based on these tool results. Be conversational and informative.`;

        // Log request sent to LLM after tool execution
        console.log('Request sent to LLM after tool execution:', {
          provider,
          contextPrompt,
          timestamp: new Date().toISOString()
        });

        if (provider === 'openai') {
          llmResponse = await llmService.generateOpenAIResponse(llm, contextPrompt);
        } else if (provider === 'anthropic') {
          llmResponse = await llmService.generateAnthropicResponse(llm, contextPrompt);
        } else if (provider === 'google') {
          // For Google, use the LangChain model directly
          const messages = [{ role: 'user', content: contextPrompt }];
          const result = await llm.invoke(messages);
          llmResponse = {
            content: result.content,
            provider: 'google',
            model: 'gemini-1.5-flash',
            usage: null
          };
        }
        
        console.log('LLM processed tool results:', llmResponse.content);
        
        return {
          response: llmResponse.content,
          toolsUsed: toolsUsed,
          reasoning: [`Executed ${toolsUsed.length} tool(s) and processed results with LLM`]
        };
        
      } catch (llmError) {
        console.error('Error getting LLM response for tool results:', llmError);
        return {
          response: response,
          toolsUsed: toolsUsed,
          reasoning: [`Executed ${toolsUsed.length} tool(s) but LLM processing failed`]
        };
      }
      
    } catch (error) {
      console.error('Error executing tools from response:', error);
      return null;
    }
  }

  getAvailableAgents() {
    const agents = Array.from(this.agents.keys()).map(provider => ({
      id: provider,
      name: this.getProviderName(provider),
      status: 'available'
    }));
    
    // Add demo agent if no real agents are available
    if (agents.length === 0) {
      agents.push({
        id: 'demo',
        name: 'Demo Mode',
        status: 'demo'
      });
    }
    
    return agents;
  }

  getProviderName(provider) {
    const names = {
      openai: 'OpenAI GPT-4',
      anthropic: 'Anthropic Claude',
      google: 'Google Gemini'
    };
    return names[provider] || provider;
  }

  async refreshTools() {
    // Recreate tools for all agents
    for (const [provider, agent] of this.agents) {
      const tools = await this.createTools();
      // Note: In a real implementation, you'd need to recreate the agent with new tools
      console.log(`Refreshed tools for ${provider} agent`);
    }
  }
}

module.exports = new AgentService();

