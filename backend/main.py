"""FastAPI entrypoint for the backend team's chat and RAG APIs."""

from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from .llm_router import llm_router
    from .rag_client import rag_client
    from .app_utils import get_logger
    from .models.schemas import ChatRequest, ChatResponse
except ImportError:  # pragma: no cover
    from llm_router import llm_router
    from rag_client import rag_client
    from app_utils import get_logger
    from models.schemas import ChatRequest, ChatResponse

load_dotenv(Path(__file__).with_name(".env"))

logger = get_logger("backend.main")

app = FastAPI(
    title="AgriSense AI Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    return {"status": "ok", "message": "Backend is running."}


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest) -> ChatResponse:
    logger.info("/chat request received")
    try:
        responses, best = await llm_router.get_multi_response(
            query=request.query,
            lang=request.lang,
        )
        return ChatResponse(responses=responses, best=best, rag_used=False, rag_context_length=0)
    except ValueError as exc:
        logger.warning("/chat validation failure: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("/chat failed")
        raise HTTPException(status_code=500, detail="Failed to generate responses.") from exc


@app.post("/rag-query", response_model=ChatResponse, tags=["RAG"])
async def rag_query(request: ChatRequest) -> ChatResponse:
    logger.info("/rag-query request received")
    try:
        context = await rag_client.fetch_context(request.query, request.lang)
        responses, best = await llm_router.get_multi_response(
            query=request.query,
            lang=request.lang,
            context=context,
        )
        rag_used = len(context.strip()) > 0
        return ChatResponse(responses=responses, best=best, rag_used=rag_used, rag_context_length=len(context), raw_context=context)
    except ValueError as exc:
        logger.warning("/rag-query validation failure: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("/rag-query failed")
        raise HTTPException(status_code=500, detail="Failed to generate RAG responses.") from exc


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
