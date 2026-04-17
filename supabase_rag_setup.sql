-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the knowledge_base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(384) -- 384 dimensions for sentence-transformers/all-MiniLM-L6-v2
);

-- Enable RLS (optional but recommended)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (or restrict to authenticated if needed)
CREATE POLICY "Allow public read access to knowledge_base"
  ON knowledge_base FOR SELECT
  USING (true);

-- Create a specialized search function for the frontend to call
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create an HNSW index for high-performance vector similarity search
CREATE INDEX ON knowledge_base USING hnsw (embedding vector_cosine_ops);
