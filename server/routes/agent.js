const express = require('express');
const agentService = require('../services/agentService');

const router = express.Router();

// Process message with agent
router.post('/chat', async (req, res) => {
  try {
    const { message, provider, chatHistory = [] } = req.body;

    if (!message || !provider) {
      return res.status(400).json({ 
        error: 'Message and provider are required' 
      });
    }

    // Validate provider
    const availableAgents = agentService.getAvailableAgents();
    const isValidProvider = availableAgents.some(agent => agent.id === provider);
    
    if (!isValidProvider) {
      return res.status(400).json({ 
        error: `Invalid provider. Available: ${availableAgents.map(a => a.id).join(', ')}` 
      });
    }

    console.log(`Processing message with ${provider} agent:`, message);

    // Process message with selected agent
    const result = await agentService.processMessage(provider, message, chatHistory);

    if (result.success) {
      res.json({
        success: true,
        response: result.response,
        reasoning: result.reasoning,
        toolsUsed: result.toolsUsed,
        provider: result.provider,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        provider: result.provider,
        timestamp: result.timestamp
      });
    }

  } catch (error) {
    console.error('Agent chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get available agents
router.get('/models', (req, res) => {
  try {
    const agents = agentService.getAvailableAgents();
    res.json({
      success: true,
      agents
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get agent status
router.get('/status/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const agents = agentService.getAvailableAgents();
    const agent = agents.find(a => a.id === provider);
    
    if (!agent) {
      return res.status(404).json({ 
        error: 'Agent not found' 
      });
    }

    res.json({
      success: true,
      agent
    });

  } catch (error) {
    console.error('Get agent status error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Refresh agent tools
router.post('/refresh-tools', async (req, res) => {
  try {
    await agentService.refreshTools();
    
    res.json({
      success: true,
      message: 'Agent tools refreshed successfully'
    });

  } catch (error) {
    console.error('Refresh tools error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Test endpoint to check agent status
router.get('/test', async (req, res) => {
  try {
    const agents = agentService.getAvailableAgents();
    const testMessage = "Hello, this is a test message";
    
    res.json({
      success: true,
      message: 'Agent service is working',
      availableAgents: agents,
      testMessage: testMessage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent test error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;

