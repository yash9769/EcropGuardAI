-- Migration 005: Community Forums
-- Tables: forum_posts, forum_replies with RLS and seed data

-- forum_posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  crop_type TEXT,
  district TEXT,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- forum_replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_expert BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts and replies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'forum_posts' AND policyname = 'Anyone can read forum posts'
  ) THEN
    CREATE POLICY "Anyone can read forum posts" ON forum_posts FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'forum_replies' AND policyname = 'Anyone can read forum replies'
  ) THEN
    CREATE POLICY "Anyone can read forum replies" ON forum_replies FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'forum_posts' AND policyname = 'Authenticated users can create posts'
  ) THEN
    CREATE POLICY "Authenticated users can create posts"
      ON forum_posts FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'forum_replies' AND policyname = 'Authenticated users can create replies'
  ) THEN
    CREATE POLICY "Authenticated users can create replies"
      ON forum_replies FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Allow upvote updates (anyone can upvote)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'forum_posts' AND policyname = 'Anyone can upvote posts'
  ) THEN
    CREATE POLICY "Anyone can upvote posts"
      ON forum_posts FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_crop ON forum_posts (crop_type);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies (post_id, created_at);

-- Seed 3 sample posts about Maharashtra crops
INSERT INTO forum_posts (title, body, crop_type, district, upvotes)
SELECT
  'How to control Pink Bollworm in Bt Cotton — Vidarbha?',
  'My Bt cotton fields in Yavatmal have been showing pink bollworm damage despite using Bt seeds. Has anyone found effective strategies this season? The infestation started around 60 DAS.',
  'Cotton',
  'Yavatmal',
  14
WHERE NOT EXISTS (
  SELECT 1 FROM forum_posts WHERE title = 'How to control Pink Bollworm in Bt Cotton — Vidarbha?'
);

INSERT INTO forum_posts (title, body, crop_type, district, upvotes)
SELECT
  'Onion post-harvest storage tips for Nasik farmers',
  'After the record harvest this year, onion prices have dropped. What are the best low-cost storage methods to hold stock for 2–3 months? I have heard about cool, dry, well-ventilated structures with net bags.',
  'Onion',
  'Nashik',
  22
WHERE NOT EXISTS (
  SELECT 1 FROM forum_posts WHERE title = 'Onion post-harvest storage tips for Nasik farmers'
);

INSERT INTO forum_posts (title, body, crop_type, district, upvotes)
SELECT
  'Soil pH correction for Sugarcane in Kolhapur',
  'My soil test shows pH 8.2 — too alkaline for sugarcane. Agronomist advised gypsum @ 5 kg/are but I want to check how others have managed alkalinity in western Maharashtra. Any experience with sulfur application?',
  'Sugarcane',
  'Kolhapur',
  9
WHERE NOT EXISTS (
  SELECT 1 FROM forum_posts WHERE title = 'Soil pH correction for Sugarcane in Kolhapur'
);
