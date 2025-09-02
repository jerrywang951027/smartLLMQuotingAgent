const express = require('express');
const mcpService = require('../services/mcpService');
const database = require('../config/database');

const router = express.Router();

// Get all MCP servers status
router.get('/servers', (req, res) => {
  try {
    const status = mcpService.getServerStatus();
    res.json({
      success: true,
      servers: status
    });
  } catch (error) {
    console.error('Get MCP servers error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get available tools from all MCP servers
router.get('/tools', (req, res) => {
  try {
    const tools = mcpService.getAvailableTools();
    res.json({
      success: true,
      tools
    });
  } catch (error) {
    console.error('Get MCP tools error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get specific MCP server details
router.get('/servers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const server = database.getMCPServer(id);
    
    if (!server) {
      return res.status(404).json({ 
        error: 'MCP server not found' 
      });
    }

    const status = mcpService.getServerStatus()[id] || { status: 'unknown' };
    
    res.json({
      success: true,
      server: {
        ...server,
        ...status
      }
    });

  } catch (error) {
    console.error('Get MCP server error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Update MCP server configuration
router.put('/servers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updated = database.updateMCPServer(id, updates);
    
    if (!updated) {
      return res.status(404).json({ 
        error: 'MCP server not found' 
      });
    }

    // Reconnect to the server if connection details changed
    if (updates.host || updates.port) {
      mcpService.reconnectToServer(id);
    }

    res.json({
      success: true,
      server: updated
    });

  } catch (error) {
    console.error('Update MCP server error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Reconnect to MCP server
router.post('/servers/:id/reconnect', async (req, res) => {
  try {
    const { id } = req.params;
    
    await mcpService.reconnectToServer(id);
    
    res.json({
      success: true,
      message: `Reconnection initiated for MCP server: ${id}`
    });

  } catch (error) {
    console.error('Reconnect MCP server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Test MCP server connection
router.post('/servers/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const status = mcpService.getServerStatus()[id];
    
    if (!status) {
      return res.status(404).json({ 
        error: 'MCP server not found' 
      });
    }

    res.json({
      success: true,
      status: status.status,
      message: `MCP server ${id} is ${status.status}`
    });

  } catch (error) {
    console.error('Test MCP server error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get MCP server tools
router.get('/servers/:id/tools', (req, res) => {
  try {
    const { id } = req.params;
    const allTools = mcpService.getAvailableTools();
    const serverTools = allTools.filter(tool => tool.serverId === id);
    
    res.json({
      success: true,
      tools: serverTools
    });

  } catch (error) {
    console.error('Get MCP server tools error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;


