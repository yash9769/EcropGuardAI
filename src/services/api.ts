import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120s timeout for complex AI reasoning
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LLMResponse {
  model: string;
  text: string;
}

export interface ChatResponse {
  query: string;
  best_answer: string;
  confidence: number;
  mode: 'rag' | 'fallback';
  agreement: string;
  answers: {
    llama: string;
    llama8b: string;
  };
  sources: {
    type: string;
    source: string;
    quality: string;
    preview: string;
    [key: string]: any;
  }[];
}

export interface DetectionResponse {
  disease_name: string;
  crop_type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  symptoms: string[];
  causes: string[];
  recommendations: string[];
  treatment_steps: string[];
  prevention_tips: string[];
  is_healthy: boolean;
  impact?: string;
  organic_controls?: string[];
  uncertainty_message?: string;
}

export interface SoilAnalysisRequest {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organic_matter: number;
  user_id?: string;
}

export interface SoilAnalysisResponse {
  health_score: number;
  recommendations: string[];
  advisory: string;
  nitrogen_status: string;
  phosphorus_status: string;
  potassium_status: string;
  ph_status: string;
}

export interface SoilHistoryItem {
  id: string;
  timestamp: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  soil_health_score: number;
}

export const ragAPI = {
  async sendMessage(query: string, lang: string = 'en', location?: string, image?: File): Promise<ChatResponse> {
    try {
      let responseData;
      
      if (image) {
        const formData = new FormData();
        formData.append('query', query);
        formData.append('lang', lang);
        if (location) formData.append('location', location);
        formData.append('image', image);

        const { data } = await api.post('/rag-query', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000 
        });
        responseData = data;
      } else {
        const { data } = await api.post('/rag-query', { query, lang, location });
        responseData = data;
      }
      
      const llamaText = responseData.responses?.find((r: any) => r.model.includes('3.3'))?.text || '';
      const fallbackText = responseData.responses?.find((r: any) => r.model.includes('3.1'))?.text || '';

      return {
        query: query,
        best_answer: responseData.best?.text || "No response generated.",
        confidence: responseData.rag_used ? 0.9 : 0.7,
        mode: responseData.rag_used ? 'rag' : 'fallback',
        agreement: responseData.rag_used ? "MULTI-MODEL VERIFIED" : "GENERAL KNOWLEDGE",
        answers: {
          llama: llamaText,
          llama8b: fallbackText,
        },
        sources: [],
        image_url: responseData.image_url // Pass through AI-suggested image
      } as any;
    } catch (error) {
      console.error('RAG Query Service Error:', error);
      throw error;
    }
  },
  async getHealth(): Promise<boolean> {
    try {
       const { data } = await api.get('/health');
       return data.status === 'online';
    } catch {
       return false;
    }
  }
};

export const uploadAPI = {
  async analyzeImage(imageFile: File, lang: string = 'en'): Promise<DetectionResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      // Adding lang as query param if backend supports it
      const { data } = await api.post<DetectionResponse>('/analyze-disease', formData, {
        params: { lang },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (error) {
      console.error('Disease Analysis Service Error:', error);
      throw error;
    }
  }
};

export const soilAPI = {
  async analyzeSoil(metrics: SoilAnalysisRequest): Promise<SoilAnalysisResponse> {
    try {
      const { data } = await api.post<SoilAnalysisResponse>('/api/soil/analyze', metrics);
      return data;
    } catch (error) {
      console.error('Soil Analysis Service Error:', error);
      throw error;
    }
  },
  async getSoilHistory(userId: string): Promise<SoilHistoryItem[]> {
    try {
      const { data } = await api.get<SoilHistoryItem[]>(`/api/soil/history/${userId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Soil History Service Error:', error);
      return [];
    }
  }
};
