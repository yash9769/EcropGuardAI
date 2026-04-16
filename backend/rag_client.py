"""RAG client using local vector search with Supabase fallback."""

from typing import Optional, Any
import asyncio
from pathlib import Path

from dotenv import load_dotenv

try:
    from .rag import rag_engine
    from .app_utils import get_logger
except ImportError:  # pragma: no cover
    from rag import rag_engine
    from app_utils import get_logger

load_dotenv(Path(__file__).with_name(".env"))

logger = get_logger("backend.rag_client")


class RAGClient:
    async def fetch_context(self, query: str, lang: str, location: Optional[str] = None) -> str:
        if not query.strip():
            raise ValueError("Query cannot be empty.")
        
        # Use the RAG engine to search for relevant context
        context = await asyncio.to_thread(rag_engine.search, query, 3, location=location)
        
        if context.strip():
            logger.info("RAG context retrieved (%d chars)", len(context))
            return context
        else:
            logger.info("No RAG context found")
            return ""


rag_client = RAGClient()
