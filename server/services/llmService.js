const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

class LLMService {
  constructor() {
    this.models = {
      openai: null,
      anthropic: null,
      google: null
    };
    this.initializeModels();
  }

  initializeModels() {
    console.log('🔧 Initializing LLM models...');
    console.log('Environment variables:');
    console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
    console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set');
    console.log('- GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Set' : 'Not set');
    
    
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.models.openai = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        temperature: 0.7
      });
      console.log('✅ OpenAI model initialized with gpt-4o-mini');
    }
    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.models.anthropic = new ChatAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-sonnet-20240229'
      });
      console.log('✅ Anthropic model initialized');
    }
    
    // Initialize Google
    if (process.env.GOOGLE_API_KEY) {
      try {
        this.models.google = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          model: 'gemini-1.5-flash'
        });
        console.log('✅ Google Gemini 1.5 Flash model initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Google model:', error);
      }
    } else {
      console.log('❌ Google API key not found');
    }
    
    console.log('Final models state:', Object.keys(this.models).filter(key => this.models[key] !== null));
  }

  getModel(provider) {
    const model = this.models[provider];
    if (!model) {
      throw new Error(`LLM provider '${provider}' not configured or API key missing`);
    }
    return model;
  }

  async generateResponse(provider, prompt, options = {}) {
    try {
      const model = this.getModel(provider);
      
      switch (provider) {
        case 'openai':
          return await this.generateOpenAIResponse(model, prompt, options);
        case 'anthropic':
          return await this.generateAnthropicResponse(model, prompt, options);
        case 'google':
          return await this.generateGoogleResponse(model, prompt, options);
        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error generating response with ${provider}:`, error);
      throw error;
    }
  }

  async generateOpenAIResponse(model, prompt, options) {
    const response = await model.invoke(prompt);
    return {
      content: response.content,
      provider: 'openai',
      model: model.model,
      usage: response.usage || null
    };
  }

  async generateAnthropicResponse(model, prompt, options) {
    const response = await model.invoke(prompt);
    return {
      content: response.content,
      provider: 'anthropic',
      model: model.model,
      usage: response.usage || null
    };
  }

  async generateGoogleResponse(model, prompt, options) {
    const genModel = model.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    
    return {
      content: response.text(),
      provider: 'google',
      model: 'gemini-2.0-flash-exp',
      usage: null
    };
  }

  getAvailableModels() {
    const available = [];
    
    if (this.models.openai) {
      available.push({
        id: 'openai',
        name: 'OpenAI GPT-4',
        provider: 'OpenAI',
        description: 'Advanced language model with strong reasoning capabilities'
      });
    }
    
    if (this.models.anthropic) {
      available.push({
        id: 'anthropic',
        name: 'Anthropic Claude',
        provider: 'Anthropic',
        description: 'Helpful, harmless, and honest AI assistant'
      });
    }
    
    if (this.models.google) {
      available.push({
        id: 'google',
        name: 'Google Gemini',
        provider: 'Google',
        description: 'Multimodal AI model with strong performance'
      });
    }
    
    return available;
  }

  validateProvider(provider) {
    return this.models[provider] !== null;
  }
}

module.exports = new LLMService();
