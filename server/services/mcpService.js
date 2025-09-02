const { spawn } = require('child_process');
const database = require('../config/database');

class MCPService {
  constructor() {
    this.connections = new Map();
    this.tools = new Map();
    this.initializeConnections();
  }

  async initializeConnections() {
    const servers = database.getMCPServers();
    
    for (const server of servers) {
      if (server.enabled) {
        await this.connectToServer(server);
      }
    }
  }

  async connectToServer(serverConfig) {
    try {
      const { id, protocol, command, args, config } = serverConfig;
      
      if (protocol === 'stdio') {
        // Create STDIO-based connection to MCP server
        const env = { ...process.env, ...config.env };
        const childProcess = spawn(command, args, { 
          stdio: ['pipe', 'pipe', 'pipe'],
          env 
        });
        
        console.log(`Starting STDIO MCP server: ${id}`);
        
        // Handle process events
        childProcess.on('spawn', () => {
          console.log(`Connected to MCP server: ${id}`);
          this.connections.set(id, { 
            process: childProcess, 
            config: serverConfig, 
            status: 'connected',
            protocol: 'stdio'
          });
          
          // Send initialization message
          this.sendMessage(id, {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              clientInfo: {
                name: 'mcp-agent-app',
                version: '1.0.0'
              }
            }
          });
        });

        childProcess.on('error', (error) => {
          console.error(`Process error for ${id}:`, error);
          this.connections.set(id, { 
            process: null, 
            config: serverConfig, 
            status: 'error',
            protocol: 'stdio'
          });
        });

        childProcess.on('exit', (code) => {
          console.log(`MCP server ${id} exited with code ${code}`);
          this.connections.set(id, { 
            process: null, 
            config: serverConfig, 
            status: 'disconnected',
            protocol: 'stdio'
          });
        });

        // Handle stdout for responses
        childProcess.stdout.on('data', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(id, message);
          } catch (error) {
            console.error(`Error parsing message from ${id}:`, error);
          }
        });

        // Handle stderr for errors
        childProcess.stderr.on('data', (data) => {
          console.error(`MCP server ${id} stderr:`, data.toString());
        });

      } else if (protocol === 'ws') {
        // WebSocket connection (for backward compatibility)
        const { host, port } = serverConfig;
        const WebSocket = require('ws');
        const ws = new WebSocket(`ws://${host}:${port}`);
        
        ws.on('open', () => {
          console.log(`Connected to WebSocket MCP server: ${id}`);
          this.connections.set(id, { 
            ws, 
            config: serverConfig, 
            status: 'connected',
            protocol: 'ws'
          });
          
          // Send initialization message
          this.sendMessage(id, {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              clientInfo: {
                name: 'mcp-agent-app',
                version: '1.0.0'
              }
            }
          });
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(id, message);
          } catch (error) {
            console.error(`Error parsing message from ${id}:`, error);
          }
        });

        ws.on('close', () => {
          console.log(`Disconnected from WebSocket MCP server: ${id}`);
          this.connections.set(id, { 
            ws: null, 
            config: serverConfig, 
            status: 'disconnected',
            protocol: 'ws'
          });
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for ${id}:`, error);
          this.connections.set(id, { 
            ws: null, 
            config: serverConfig, 
            status: 'error',
            protocol: 'ws'
          });
        });
      }

    } catch (error) {
      console.error(`Failed to connect to MCP server ${serverConfig.id}:`, error);
      this.connections.set(serverConfig.id, { 
        process: null, 
        config: serverConfig, 
        status: 'failed',
        protocol: serverConfig.protocol || 'unknown'
      });
    }
  }

  handleMessage(serverId, message) {
    if (message.method === 'tools/list') {
      this.updateTools(serverId, message.params.tools || []);
    }
  }

  updateTools(serverId, tools) {
    for (const tool of tools) {
      const toolId = `${serverId}:${tool.name}`;
      this.tools.set(toolId, {
        ...tool,
        serverId,
        fullName: toolId
      });
    }
  }

  sendMessage(serverId, message) {
    const connection = this.connections.get(serverId);
    if (!connection) return;

    if (connection.protocol === 'stdio' && connection.process) {
      // Send message to STDIO process via stdin
      connection.process.stdin.write(JSON.stringify(message) + '\n');
    } else if (connection.protocol === 'ws' && connection.ws && connection.ws.readyState === 1) {
      // Send message to WebSocket
      connection.ws.send(JSON.stringify(message));
    }
  }

  async invokeTool(toolName, parameters) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const connection = this.connections.get(tool.serverId);
    if (!connection || connection.status !== 'connected') {
      throw new Error(`MCP server ${tool.serverId} not connected`);
    }

    const messageId = Date.now();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Tool invocation timeout: ${toolName}`));
      }, 30000);

      if (connection.protocol === 'stdio') {
        // Handle STDIO response
        const messageHandler = (data) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.id === messageId) {
              clearTimeout(timeout);
              connection.process.stdout.removeListener('data', messageHandler);
              
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            }
          } catch (error) {
            console.error('Error parsing tool response:', error);
          }
        };

        connection.process.stdout.on('data', messageHandler);

        this.sendMessage(tool.serverId, {
          jsonrpc: '2.0',
          id: messageId,
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: parameters
          }
        });
      } else if (connection.protocol === 'ws') {
        // Handle WebSocket response
        const messageHandler = (data) => {
          try {
            const response = JSON.parse(data.toString());
            if (response.id === messageId) {
              clearTimeout(timeout);
              connection.ws.removeEventListener('message', messageHandler);
              
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            }
          } catch (error) {
            console.error('Error parsing tool response:', error);
          }
        };

        connection.ws.addEventListener('message', messageHandler);

        this.sendMessage(tool.serverId, {
          jsonrpc: '2.0',
          id: messageId,
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: parameters
          }
        });
      }
    });
  }

  getAvailableTools() {
    return Array.from(this.tools.values()).map(tool => ({
      id: tool.fullName,
      name: tool.name,
      description: tool.description,
      serverId: tool.serverId,
      parameters: tool.inputSchema || {}
    }));
  }

  getServerStatus() {
    const status = {};
    for (const [id, connection] of this.connections) {
      status[id] = {
        id,
        name: connection.config.name,
        status: connection.status,
        protocol: connection.protocol,
        ...(connection.protocol === 'ws' ? {
          host: connection.config.host,
          port: connection.config.port
        } : {
          command: connection.config.command,
          args: connection.config.args
        })
      };
    }
    return status;
  }

  async reconnectToServer(serverId) {
    const connection = this.connections.get(serverId);
    if (connection) {
      if (connection.protocol === 'stdio' && connection.process) {
        connection.process.kill();
      } else if (connection.protocol === 'ws' && connection.ws) {
        connection.ws.close();
      }
      await this.connectToServer(connection.config);
    }
  }
}

module.exports = new MCPService();
