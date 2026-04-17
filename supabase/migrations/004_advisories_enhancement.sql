-- Migration 004: Advisories Enhancement
-- Adds target_districts column and seeds 3 Maharashtra advisories

-- Add target_districts column if not present
ALTER TABLE advisories ADD COLUMN IF NOT EXISTS target_districts TEXT[];

-- Track whether this advisory has been broadcast via Realtime
ALTER TABLE advisories ADD COLUMN IF NOT EXISTS broadcast_sent BOOLEAN DEFAULT false;

-- Enable RLS on advisories (may already be set)
ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to advisories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'advisories' AND policyname = 'Allow public read of advisories'
  ) THEN
    CREATE POLICY "Allow public read of advisories"
      ON advisories FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Allow service_role to insert/update advisories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'advisories' AND policyname = 'Service role can manage advisories'
  ) THEN
    CREATE POLICY "Service role can manage advisories"
      ON advisories FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- Index for fast state/district lookup
CREATE INDEX IF NOT EXISTS idx_advisories_created_at ON advisories (created_at DESC);

-- Seed 3 sample advisories for Maharashtra (idempotent via title check)
INSERT INTO advisories (title, body, severity, target_states, target_districts)
SELECT
  'Cotton Pink Bollworm Alert — Vidarbha Region',
  'Farmers in Vidarbha are advised to monitor cotton fields for Pink Bollworm (Pectinophora gossypiella) infestation. Population levels have crossed ETL in Nagpur and Amravati districts. Recommended action: Use pheromone traps (5 per acre) and apply emamectin benzoate 5% SG @ 220 ml/acre. Protect natural enemies by avoiding broad-spectrum insecticides.',
  'high',
  ARRAY['Maharashtra'],
  ARRAY['Nagpur', 'Amravati', 'Wardha', 'Yavatmal']
WHERE NOT EXISTS (
  SELECT 1 FROM advisories WHERE title = 'Cotton Pink Bollworm Alert — Vidarbha Region'
);

INSERT INTO advisories (title, body, severity, target_states, target_districts)
SELECT
  'Soybean Yellow Mosaic Virus Warning — Marathwada',
  'Yellow Mosaic Virus (YMV) transmitted by whiteflies has been detected in soybean fields across Marathwada. Farmers should rogue out infected plants immediately and apply thiamethoxam 25 WG @ 100 g/acre to control the whitefly vector. Avoid planting susceptible varieties MACS 1188 and JS 335 in affected areas.',
  'critical',
  ARRAY['Maharashtra'],
  ARRAY['Aurangabad', 'Latur', 'Osmanabad', 'Nanded', 'Hingoli']
WHERE NOT EXISTS (
  SELECT 1 FROM advisories WHERE title = 'Soybean Yellow Mosaic Virus Warning — Marathwada'
);

INSERT INTO advisories (title, body, severity, target_states, target_districts)
SELECT
  'Unseasonal Rain Advisory — Nashik Grape Growers',
  'Unseasonal rainfall forecast for Nashik district over the next 72 hours. Grape growers are advised to apply protective fungicides (mancozeb 75 WP @ 2.5 g/L or copper oxychloride 50 WP @ 3 g/L) before rain to prevent downy mildew (Plasmopara viticola) onset. Do NOT apply within 7 days of harvest.',
  'medium',
  ARRAY['Maharashtra'],
  ARRAY['Nashik', 'Niphad', 'Dindori']
WHERE NOT EXISTS (
  SELECT 1 FROM advisories WHERE title = 'Unseasonal Rain Advisory — Nashik Grape Growers'
);
