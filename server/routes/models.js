const express = require('express');
const llmService = require('../services/llmService');

const router = express.Router();

// Get all available LLM models
router.get('/', (req, res) => {
  try {
    const models = llmService.getAvailableModels();
    res.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Get specific model details
router.get('/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!llmService.validateProvider(provider)) {
      return res.status(404).json({ 
        error: 'Model not found or not configured' 
      });
    }

    const models = llmService.getAvailableModels();
    const model = models.find(m => m.id === provider);
    
    res.json({
      success: true,
      model
    });

  } catch (error) {
    console.error('Get model error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Test model connection
router.post('/:provider/test', async (req, res) => {
  try {
    const { provider } = req.params;
    const { prompt = 'Hello, this is a test message.' } = req.body;
    
    if (!llmService.validateProvider(provider)) {
      return res.status(404).json({ 
        error: 'Model not found or not configured' 
      });
    }

    const response = await llmService.generateResponse(provider, prompt, { maxTokens: 50 });
    
    res.json({
      success: true,
      test: {
        provider,
        prompt,
        response: response.content,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test model error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get model configuration
router.get('/:provider/config', (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!llmService.validateProvider(provider)) {
      return res.status(404).json({ 
        error: 'Model not found or not configured' 
      });
    }

    // Return model-specific configuration
    const config = {
      provider,
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000
    };

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Get model config error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;


