import { supabase } from './supabase';

/**
 * ragService.ts
 * 
 * Handles obtaining embeddings for queries and searching the Supabase knowledge base.
 * Using HuggingFace's free inference API for all-MiniLM-L6-v2 (matches your ingestion model).
 */

// Import Transformers.js for browser-side embeddings
let pipelineModule: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    if (!pipelineModule) {
      // Import the library and environment configuration
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      
      // CRITICAL: Block all local lookups which cause the <!doctype html error
      env.allowLocalModels = false;
      env.remoteHost = 'https://huggingface.co';
      env.remotePathTemplate = '{model}/resolve/{revision}/';
      
      // Optional: use a mirror if HF is slow
      // env.remoteHost = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/models/';
      
      pipelineModule = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    const output = await pipelineModule(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error("RAG Error: Client-side embedding could not initialize.", error);
    throw error;
  }
}

export interface KnowledgeResult {
  content: string;
  metadata: {
    source: string;
    page: number;
    chunk_start: number;
  };
  similarity: number;
}

export async function queryKnowledgeBase(query: string, limit: number = 5, state?: string): Promise<string> {
  try {
    let embedding: number[] | null = null;
    let results: KnowledgeResult[] = [];

    // 1. Try Vector Search (Semantic)
    try {
      const enrichedQuery = state ? `${query} related to ${state} India crops and diseases` : query;
      embedding = await getEmbedding(enrichedQuery);

      if (embedding) {
        const { data, error } = await supabase.rpc('match_knowledge', {
          query_embedding: embedding,
          match_threshold: 0.4, 
          match_count: limit
        });
        if (!error) results = data as KnowledgeResult[];
      }
    } catch (e) {
      console.warn("RAG: Vector Search failed, using Keyword Search fallback.");
    }

    // 2. Keyword Search Fallback if Vector Search failed or returned nothing
    if (results.length === 0) {
      // Use the first 3 keywords for search
      const keywords = query.split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 3)
        .join(' & ');

      if (keywords) {
        const { data: ftsData } = await supabase
          .from('knowledge_base')
          .select('content, metadata')
          .textSearch('content', keywords)
          .limit(limit);

        if (ftsData) {
          results = ftsData.map(d => ({
            content: d.content,
            metadata: d.metadata as any,
            similarity: 0.5
          }));
        }
      }
    }

    if (results.length === 0) return "";

    // 3. Format context for the LLM
    const context = results
      .map((r, i) => `[Source ${i+1}: ${r.metadata.source || 'Research Paper'}]\nContent: ${r.content}`)
      .join("\n\n---\n\n");

    return context;
  } catch (error) {
    console.error("RAG Query failed:", error);
    return "";
  }
}
