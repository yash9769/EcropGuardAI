import os
import numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

try:
    from .utils.logger import logger
except ImportError:
    from utils.logger import logger

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

class RAGEngine:
    def __init__(self) -> None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        try:
            self._encoder = SentenceTransformer(EMBEDDING_MODEL)
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            self._encoder = None

        # Fallback knowledge base for localized testing
        self._fallback_texts = [
            "Leaf Blight is spotted on leaves. Common in corn/rice, thrives in humid conditions.",
            "Bacterial Wilt causes rapid death. Milky ooze from stem is a key sign.",
            "Tomato Yellow Leaf Curl is spread by whiteflies; causes stunted yellow growth.",
            "Nitrogen deficiency causes general yellowing. Apply urea to correct.",
            "Rust in wheat is caused by fungal pathogens. Use resistant varieties and crop rotation to prevent rust in wheat.",
            "Powdery mildew appears as white powdery coating on leaves. Improve air circulation to prevent powdery mildew.",
            "Black spot on roses caused by fungus. Prune infected parts and apply fungicide.",
            "Aphids are small insects that suck plant sap. Use insecticidal soap or neem oil to control aphids.",
            "Root rot occurs in waterlogged soil. Improve drainage and avoid overwatering to prevent root rot.",
            "Corn borer larvae bore into corn stalks. Use Bt toxin or parasitic wasps for corn borer control.",
            "To prevent rust in wheat, plant resistant varieties, practice crop rotation, and apply fungicides when needed.",
            "Wheat rust prevention includes using certified seeds, proper field sanitation, and timely fungicide application.",
            "Stripe rust in wheat can be prevented by planting resistant cultivars and avoiding late planting.",
            "Leaf rust prevention in wheat involves crop rotation with non-host crops and fungicide sprays.",
            "Stem rust control in wheat requires resistant varieties and monitoring weather conditions.",
        ]

        # Pre-compute embeddings for fallback texts
        if self._encoder:
            try:
                self._fallback_embeddings = self._encoder.encode(self._fallback_texts)
                logger.info("Pre-computed embeddings for fallback knowledge base.")
            except Exception as e:
                logger.error(f"Failed to compute embeddings: {e}")
                self._fallback_embeddings = None
        else:
            self._fallback_embeddings = None

    def search(self, query: str, top_k: int = 3) -> str:
        """
        Search for relevant context using local vector search.
        """
        logger.info(f"RAG searching for: {query[:50]}...")

        if not self._encoder or self._fallback_embeddings is None:
            logger.warning("Embedding model not available, using basic text matching.")
            # Simple text matching fallback
            relevant_texts = []
            query_lower = query.lower()
            for text in self._fallback_texts:
                if any(word in text.lower() for word in query_lower.split()):
                    relevant_texts.append(text)
                    if len(relevant_texts) >= top_k:
                        break
            if relevant_texts:
                context = "\n".join(f"- {text}" for text in relevant_texts[:top_k])
                logger.info(f"Found {len(relevant_texts)} matches via text matching.")
                return context
            return ""

        try:
            # Generate embedding for query
            query_embedding = self._encoder.encode([query])[0]

            # Compute cosine similarities
            similarities = np.dot(self._fallback_embeddings, query_embedding) / (
                np.linalg.norm(self._fallback_embeddings, axis=1) * np.linalg.norm(query_embedding)
            )

            # Get top-k most similar texts
            top_indices = np.argsort(similarities)[::-1][:top_k]
            relevant_texts = [self._fallback_texts[i] for i in top_indices if similarities[i] > 0.1]

            if relevant_texts:
                context = "\n".join(f"- {text}" for text in relevant_texts)
                logger.info(f"Found {len(relevant_texts)} matches via vector search.")
                return context
            else:
                logger.info("No relevant context found.")
                return ""

        except Exception as e:
            logger.error(f"RAG search failed: {e}")
            return ""

# Module-level singleton
rag_engine = RAGEngine()
