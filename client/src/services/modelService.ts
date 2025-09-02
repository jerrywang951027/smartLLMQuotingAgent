import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

interface ModelConfig {
  provider: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

const modelService = {
  async getModels(): Promise<{ success: boolean; models: Model[] }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/models`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to get models');
      }
      throw new Error('Network error');
    }
  },

  async getModel(provider: string): Promise<{ success: boolean; model: Model }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/models/${provider}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to get model');
      }
      throw new Error('Network error');
    }
  },

  async testModel(provider: string, prompt: string = 'Hello, this is a test message.') {
    try {
      const response = await axios.post(`${API_BASE_URL}/models/${provider}/test`, { prompt });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to test model');
      }
      throw new Error('Network error');
    }
  },

  async getModelConfig(provider: string): Promise<{ success: boolean; config: ModelConfig }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/models/${provider}/config`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to get model config');
      }
      throw new Error('Network error');
    }
  }
};

export { modelService };


