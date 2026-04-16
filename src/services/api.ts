/**
 * Centralised API client for eCropGuard AI backend.
 *
 * Base URL resolves as follows:
 *   1. VITE_API_URL (set in .env / Vercel env) — use in production
 *   2. Falls back to '' (empty) which uses the Vite proxy (/chat → localhost:8000/chat)
 *
 * Backend contract:
 *   POST /chat           → { query: string, lang?: string }
 *   POST /rag-query      → { query: string, lang?: string }
 *   POST /detect-disease → FormData { file: File, language?: string }
 */

import axios from 'axios';

const api = axios.create({
  // In production VITE_API_URL should be set to your backend URL (e.g. https://api.yourapp.com)
  // In dev, Vite proxy handles /chat → http://localhost:8000
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 45000,
});

// -----------------------------------------------------------------------
// Request interceptor: attach Supabase JWT if present
// -----------------------------------------------------------------------
api.interceptors.request.use((config) => {
  try {
    // Look for the Supabase session in localStorage (key format: sb-<ref>-auth-token)
    const storageKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (storageKey) {
      const session = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
      const token = session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore — guest mode
  }
  return config;
});

// -----------------------------------------------------------------------
// Chat API  →  POST /chat
// Response: { responses: [{ model, text }], best: { model, text }, rag_used, ... }
// -----------------------------------------------------------------------
export const chatAPI = {
  /**
   * Send a message and receive multi-model responses.
   * @param query   - User message / agricultural question
   * @param lang    - Language code: 'en' | 'hi' | 'mr'  (default 'en')
   */
  sendMessage: async (query: string, lang: string = 'en') => {
    const response = await api.post('/chat', { query, lang });
    return response.data as {
      responses: { model: string; text: string }[];
      best: { model: string; text: string };
      rag_used: boolean;
      rag_context_length: number;
      raw_context?: string;
    };
  },
};

// -----------------------------------------------------------------------
// RAG-enhanced chat  →  POST /rag-query
// -----------------------------------------------------------------------
export const ragAPI = {
  sendMessage: async (query: string, lang: string = 'en') => {
    const response = await api.post('/rag-query', { query, lang });
    return response.data as {
      responses: { model: string; text: string }[];
      best: { model: string; text: string };
      rag_used: boolean;
      rag_context_length: number;
      raw_context?: string;
    };
  },
};

// -----------------------------------------------------------------------
// Disease Detection  →  POST /detect-disease  (multipart/form-data)
// -----------------------------------------------------------------------
export const uploadAPI = {
  /**
   * Upload a crop image and receive a disease diagnosis.
   * @param imageFile  - File object from <input type="file">
   * @param language   - Language code: 'en' | 'hi' | 'mr'
   */
  analyzeImage: async (imageFile: File, language: string = 'en') => {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('language', language);

    const response = await api.post('/detect-disease', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api;
