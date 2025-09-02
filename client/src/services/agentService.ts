import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface ChatRequest {
  message: string;
  provider: string;
  chatHistory: any[];
}

interface ChatResponse {
  success: boolean;
  response: string;
  reasoning: any[];
  toolsUsed: any[];
  provider: string;
  timestamp: string;
}

const agentService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/agent/chat`, request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Chat failed');
      }
      throw new Error('Network error');
    }
  },

  async getModels() {
    try {
      const response = await axios.get(`${API_BASE_URL}/agent/models`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to get models');
      }
      throw new Error('Network error');
    }
  },

  async getModelStatus(provider: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/agent/status/${provider}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to get model status');
      }
      throw new Error('Network error');
    }
  },

  async refreshTools() {
    try {
      const response = await axios.post(`${API_BASE_URL}/agent/refresh-tools`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to refresh tools');
      }
      throw new Error('Network error');
    }
  }
};

export { agentService };


