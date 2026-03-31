import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
};

export type Scan = {
  id: string;
  user_id: string;
  image_url: string | null;
  disease_name: string | null;
  confidence: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  crop_type: string | null;
  recommendations: string[] | null;
  treatment_steps: string[] | null;
  raw_ai_response: string | null;
  language: string;
  created_at: string;
};
