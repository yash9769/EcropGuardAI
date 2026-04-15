import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
});

export const chatAPI = {
  sendMessage: async (message: string) => {
    const response = await api.post('/chat', { message });
    return response.data;
  },
};

export const uploadAPI = {
  analyzeImage: async (image: FormData) => {
    const response = await api.post('/upload', image, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api;

