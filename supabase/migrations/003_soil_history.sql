-- Migration 003: Soil Analyses History
-- Run in Supabase SQL editor or via CLI

-- Soil analyses table
CREATE TABLE IF NOT EXISTS soil_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nitrogen FLOAT,
  phosphorus FLOAT,
  potassium FLOAT,
  ph FLOAT,
  moisture FLOAT,
  organic_matter FLOAT,
  health_score FLOAT,
  recommendations JSONB,
  advisory TEXT,
  nitrogen_status TEXT,
  phosphorus_status TEXT,
  potassium_status TEXT,
  ph_status TEXT,
  region TEXT DEFAULT 'maharashtra',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE soil_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only read/write their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'soil_analyses' AND policyname = 'Users can view own soil analyses'
  ) THEN
    CREATE POLICY "Users can view own soil analyses"
      ON soil_analyses FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'soil_analyses' AND policyname = 'Users can insert own soil analyses'
  ) THEN
    CREATE POLICY "Users can insert own soil analyses"
      ON soil_analyses FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'soil_analyses' AND policyname = 'Users can delete own soil analyses'
  ) THEN
    CREATE POLICY "Users can delete own soil analyses"
      ON soil_analyses FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Performance index
CREATE INDEX IF NOT EXISTS idx_soil_analyses_user_created
  ON soil_analyses (user_id, created_at DESC);
