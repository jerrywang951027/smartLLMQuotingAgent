// Simple in-memory database for demo purposes
// In production, use a real database like PostgreSQL or MongoDB

class InMemoryDB {
  constructor() {
    this.users = new Map();
    this.mcpServers = new Map();
    this.sessions = new Map();
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  initializeDemoData() {
    // Demo user
    this.users.set('demo@example.com', {
      id: '1',
      email: 'demo@example.com',
      password: '$2a$10$demo.hash.for.demo.purposes',
      name: 'Demo User'
    });

    // Demo MCP server config
    this.mcpServers.set('salesforce', {
      id: 'salesforce',
      name: 'Salesforce',
      protocol: 'stdio',
      command: 'npx',
      args: ['@modelcontextprotocol/server-salesforce'],
      enabled: false, // Disabled by default since the package doesn't exist yet
      config: {
        auth: {
          type: 'token',
          token: process.env.MCP_SALESFORCE_TOKEN || 'demo_token'
        },
        capabilities: ['tools', 'resources', 'prompts'],
        env: {
          SALESFORCE_ACCESS_TOKEN: process.env.MCP_SALESFORCE_TOKEN || 'demo_token',
          SALESFORCE_INSTANCE_URL: process.env.SALESFORCE_INSTANCE_URL || 'https://demo.salesforce.com'
        }
      }
    });

    // Free Weather MCP server config (using wttr.in - no API key required)
    this.mcpServers.set('weather', {
      id: 'weather',
      name: 'Weather Service',
      protocol: 'stdio',
      command: 'python3',
      args: ['-m', 'mcp_weather_server'],
      enabled: false, // Disabled since we have built-in weather tool
      config: {
        auth: {
          type: 'none'
        },
        capabilities: ['tools'],
        env: {}
      }
    });
  }

  // User methods
  getUserByEmail(email) {
    return this.users.get(email);
  }

  createUser(userData) {
    const id = Date.now().toString();
    const user = { id, ...userData };
    this.users.set(userData.email, user);
    return user;
  }

  // MCP Server methods
  getMCPServers() {
    return Array.from(this.mcpServers.values());
  }

  getMCPServer(id) {
    return this.mcpServers.get(id);
  }

  updateMCPServer(id, config) {
    const server = this.mcpServers.get(id);
    if (server) {
      const updated = { ...server, ...config };
      this.mcpServers.set(id, updated);
      return updated;
    }
    return null;
  }

  // Session methods
  createSession(userId) {
    const sessionId = Date.now().toString() + Math.random().toString(36);
    this.sessions.set(sessionId, { userId, createdAt: new Date() });
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }
}

module.exports = new InMemoryDB();
