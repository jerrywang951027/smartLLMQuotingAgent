import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const authService = {
  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      }
      throw new Error('Network error');
    }
  },

  async logout(sessionId?: string) {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, { sessionId });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async verifyToken(token: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
};

export { authService };


