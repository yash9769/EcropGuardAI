import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase config missing. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project. Using mock client for demo.');
  const mockSupabase = {
    auth: {
      signInWithOtp: async () => ({}),
      signUp: async () => ({}),
      signOut: async () => {},
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [] }),
      }),
      insert: () => Promise.resolve({ data: [] }),
      delete: () => Promise.resolve({ data: [] }),
    }),
  } as any;
  supabase = mockSupabase;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

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
