"""Local vector-based RAG engine for Indian agriculture.

Priority: Supabase knowledge_base (match_knowledge RPC) → FALLBACK_KNOWLEDGE
"""

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
# Kept as safety-net fallback — do NOT delete
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

# ---------------------------------------------------------------------------
# Supabase client — initialised lazily so the server still starts if creds
# are missing (fallback mode)
# ---------------------------------------------------------------------------
_supabase_client = None


def _get_supabase():
    """Return a Supabase client, or None if credentials are missing."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        logger.warning(
            "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — RAG will use fallback."
        )
        return None

    try:
        from supabase import create_client  # type: ignore
        _supabase_client = create_client(supabase_url, service_role_key)
        logger.info("Supabase RAG client initialised (URL: %s)", supabase_url)
    except Exception as exc:
        logger.error("Failed to create Supabase client: %s", exc)
        _supabase_client = None

    return _supabase_client


class RAGEngine:
    def __init__(self) -> None:
        logger.info("Initializing RAG Engine | Model: %s", EMBEDDING_MODEL)
        try:
            # Note: This might download the model on first run (30-50MB)
            self._encoder = SentenceTransformer(EMBEDDING_MODEL)
            # Local fallback corpus — used only when Supabase is unreachable
            self._fallback_texts = FALLBACK_KNOWLEDGE
            self._fallback_embeddings = self._encoder.encode(
                self._fallback_texts, convert_to_numpy=True
            )
            logger.info(
                "RAG Engine loaded. Fallback corpus: %d docs. Primary: Supabase knowledge_base.",
                len(self._fallback_texts),
            )
        except Exception as exc:
            logger.error("Failed to load RAG Engine: %s", exc)
            self._encoder = None
            self._fallback_texts = []
            self._fallback_embeddings = None

    # ------------------------------------------------------------------
    # Public API — unchanged signature so rag_client.py needs zero edits
    # ------------------------------------------------------------------

    def search(self, query: str, top_k: int = 5, location: Optional[str] = None) -> str:
        """
        Search for relevant agricultural context.

        Flow:
          1. Try Supabase match_knowledge RPC (real ingested PDFs)
          2. If that fails or returns empty → try local fallback corpus
          3. Apply location-based re-ranking in both cases
        """
        if not query.strip() or self._encoder is None:
            return ""

        try:
            logger.info("RAG Searching: '%s' | Location: %s", query[:40], location)
            query_emb = self._encoder.encode([query], convert_to_numpy=True)[0]

            # --- Primary path: Supabase ---
            results = self._search_supabase(query_emb, top_k, location)

            if results:
                context = "\n".join(f"RESEARCH DATA: {text}" for text in results)
                logger.info("RAG: returned %d chunks from Supabase knowledge_base.", len(results))
                return context

            # --- Fallback path: local corpus ---
            logger.info("RAG: Supabase returned empty — using fallback corpus.")
            results = self._search_local(query_emb, top_k, location)

            if results:
                context = "\n".join(f"RESEARCH DATA: {text}" for text in results)
                logger.info("RAG: returned %d chunks from fallback corpus.", len(results))
                return context

            logger.info("RAG: No relevant matches found in either source.")
            return ""

        except Exception as exc:
            logger.error("RAG search error: %s", exc)
            return ""

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _search_supabase(
        self, query_emb: np.ndarray, top_k: int, location: Optional[str]
    ) -> List[str]:
        """Query Supabase match_knowledge RPC. Returns list of content strings."""
        client = _get_supabase()
        if client is None:
            return []

        try:
            embedding_list = query_emb.tolist()

            # match_knowledge is defined in supabase_rag_setup.sql
            response = (
                client.rpc(
                    "match_knowledge",
                    {
                        "query_embedding": embedding_list,
                        "match_threshold": 0.15,
                        "match_count": top_k,
                    },
                )
                .execute()
            )

            rows = getattr(response, "data", None) or []
            if not rows:
                logger.info("match_knowledge RPC returned 0 rows.")
                return []

            texts = [row["content"] for row in rows if row.get("content")]

            # Apply location boost on results list if location provided
            if location and texts:
                texts = self._apply_location_boost_list(texts, location)

            logger.info("match_knowledge RPC returned %d rows.", len(texts))
            return texts[:top_k]

        except Exception as exc:
            logger.error("Supabase RPC match_knowledge failed: %s", exc)
            return []

    def _search_local(
        self, query_emb: np.ndarray, top_k: int, location: Optional[str]
    ) -> List[str]:
        """Cosine-similarity search on the local FALLBACK_KNOWLEDGE corpus."""
        if self._fallback_embeddings is None or len(self._fallback_texts) == 0:
            return []

        try:
            norms = np.linalg.norm(self._fallback_embeddings, axis=1) * np.linalg.norm(query_emb)
            norms[norms == 0] = 1e-10
            similarities = np.dot(self._fallback_embeddings, query_emb) / norms

            if location:
                similarities = self._apply_location_boost_array(similarities, location)

            top_indices = np.argsort(similarities)[::-1][:top_k]
            results: List[str] = []
            for i in top_indices:
                if similarities[i] > 0.15:
                    results.append(self._fallback_texts[i])
            return results

        except Exception as exc:
            logger.error("Local RAG search error: %s", exc)
            return []

    def _apply_location_boost_list(self, texts: List[str], location: str) -> List[str]:
        """Re-order a list of texts, promoting location-matched ones to front."""
        loc_lower = location.lower()
        region_map = {
            "maharashtra": "[MH]", "mumbai": "[MH]", "pune": "[MH]", "nagpur": "[MH]",
            "nashik": "[MH]", "aurangabad": "[MH]", "solapur": "[MH]", "amravati": "[MH]",
            "haryana": "[HR]", "gurugram": "[HR]", "faridabad": "[HR]", "panipat": "[HR]",
            "ambala": "[HR]", "karnal": "[HR]", "hisar": "[HR]", "rohtak": "[HR]",
        }
        active_marker = next(
            (marker for key, marker in region_map.items() if key in loc_lower), None
        )
        if not active_marker:
            return texts
        boosted = [t for t in texts if active_marker in t]
        rest = [t for t in texts if active_marker not in t]
        return boosted + rest

    def _apply_location_boost_array(
        self, similarities: np.ndarray, location: str
    ) -> np.ndarray:
        """Boost regional results and penalise mismatched ones (array variant)."""
        loc_lower = location.lower()
        region_map = {
            "maharashtra": "[MH]", "mumbai": "[MH]", "pune": "[MH]", "nagpur": "[MH]",
            "nashik": "[MH]", "aurangabad": "[MH]", "solapur": "[MH]", "amravati": "[MH]",
            "haryana": "[HR]", "gurugram": "[HR]", "faridabad": "[HR]", "panipat": "[HR]",
            "ambala": "[HR]", "karnal": "[HR]", "hisar": "[HR]", "rohtak": "[HR]",
        }
        active_marker = next(
            (marker for key, marker in region_map.items() if key in loc_lower), None
        )
        if not active_marker:
            return similarities

        logger.info("Applying regional boost for %s", active_marker)
        boosted = similarities.copy()
        for i, text in enumerate(self._fallback_texts):
            if active_marker in text:
                boosted[i] *= 2.0
            elif any(m in text for m in ["[MH]", "[HR]"]):
                boosted[i] *= 0.4
        return boosted


# Module-level singleton
rag_engine = RAGEngine()
