"""Local vector-based RAG engine for Indian agriculture."""

import os
from typing import List, Optional, Tuple

import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

try:
    from .app_utils import get_logger
except ImportError:  # pragma: no cover
    from app_utils import get_logger

load_dotenv()

logger = get_logger("backend.rag")

EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Regional markers: [MH] = Maharashtra, [HR] = Haryana
# Production goal: replace this with a vector database (Supabase/Chroma/Pinecone)
FALLBACK_KNOWLEDGE = [
    "[Global] Leaf Blight is spotted on leaves. Common in corn/rice, thrives in humid conditions.",
    "[Global] Bacterial Wilt causes rapid death. Milky ooze from stem is a key sign.",
    "[MH] In Maharashtra, cotton is a primary crop. Black soil (Regur) is ideal for cultivation in Vidarbha.",
    "[MH] Sugarcane in Western Maharashtra is often affected by Red Rot; requires proper drainage.",
    "[MH] Pomegranate farming in Solapur, Maharashtra, faces challenges from Bacterial Blight (Telya).",
    "[HR] In Haryana, wheat (Kanak) is a staple. Early sowing in November is recommended.",
    "[HR] Basmati rice in Karnal, Haryana, is susceptible to Blast disease. Ensure proper water management.",
    "[HR] Mustard (Sarson) in Haryana is prone to White Rust. Use certified seeds and avoid late sowing.",
    "[Global] Tomato Yellow Leaf Curl is spread by whiteflies; causes stunted yellow growth.",
    "[Global] Nitrogen deficiency causes general yellowing. Apply urea as a correction.",
    "[Global] Rust in wheat is fungal. Use resistant varieties and timely fungicide application.",
    "[Global] Powdery mildew appears as white coating on leaves. Use neem oil or sulfur-based sprays.",
    "[Global] Aphids suck sap. Use yellow sticky traps or insecticidal soaps.",
]


class RAGEngine:
    def __init__(self) -> None:
        logger.info("Initializing RAG Engine | Model: %s", EMBEDDING_MODEL)
        try:
            # Note: This might download the model on first run (30-50MB)
            self._encoder = SentenceTransformer(EMBEDDING_MODEL)
            self._texts = FALLBACK_KNOWLEDGE
            self._embeddings = self._encoder.encode(self._texts, convert_to_numpy=True)
            logger.info("RAG Engine loaded with %d local documents.", len(self._texts))
        except Exception as exc:
            logger.error("Failed to load RAG Engine: %s", exc)
            self._encoder = None
            self._texts = []
            self._embeddings = None

    def search(self, query: str, top_k: int = 3, location: Optional[str] = None) -> str:
        """
        Search for relevant agricultural context with location-based re-ranking.
        """
        if not query.strip() or self._embeddings is None:
            return ""

        try:
            logger.info("RAG Searching: '%s' | Location: %s", query[:40], location)
            query_emb = self._encoder.encode([query], convert_to_numpy=True)[0]

            # Cosine similarity
            norms = np.linalg.norm(self._embeddings, axis=1) * np.linalg.norm(query_emb)
            norms[norms == 0] = 1e-10  # Avoid division by zero
            similarities = np.dot(self._embeddings, query_emb) / norms

            # Apply location boosting
            if location:
                similarities = self._apply_location_boost(similarities, location)

            # Extract top indices
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            # Filter matches below a threshold (0.15 is conservative for cosine)
            results: List[str] = []
            for i in top_indices:
                if similarities[i] > 0.15:
                    results.append(self._texts[i])
            
            if not results:
                logger.info("No relevant matches found above threshold.")
                return ""

            context = "\n".join(f"RESEARCH DATA: {text}" for text in results)
            logger.info("Retrieved %d matches.", len(results))
            return context

        except Exception as exc:
            logger.error("RAG search error: %s", exc)
            return ""

    def _apply_location_boost(self, similarities: np.ndarray, location: str) -> np.ndarray:
        """Boost regional results and penalize mismatched ones."""
        loc_lower = location.lower()
        
        # City/State to Marker map
        region_map = {
            "maharashtra": "[MH]", "mumbai": "[MH]", "pune": "[MH]", "nagpur": "[MH]", 
            "nashik": "[MH]", "aurangabad": "[MH]", "solapur": "[MH]", "amravati": "[MH]",
            "haryana": "[HR]", "gurugram": "[HR]", "faridabad": "[HR]", "panipat": "[HR]", 
            "ambala": "[HR]", "karnal": "[HR]", "hisar": "[HR]", "rohtak": "[HR]"
        }
        
        active_marker = None
        for key, marker in region_map.items():
            if key in loc_lower:
                active_marker = marker
                break
        
        if not active_marker:
            return similarities
            
        logger.info("Applying regional boost for %s", active_marker)
        boosted = similarities.copy()
        for i, text in enumerate(self._texts):
            if active_marker in text:
                boosted[i] *= 2.0  # Significant boost for local data
            elif any(m in text for m in ["[MH]", "[HR]"]):
                boosted[i] *= 0.4  # Penalty for non-matching specific regions
                
        return boosted


# Module-level singleton
rag_engine = RAGEngine()
