"""FastAPI entrypoint for eCropGuard AI backend — chat, RAG and disease detection APIs."""

from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from .llm_router import llm_router
    from .rag_client import rag_client
    from .app_utils import get_logger
    from .models.schemas import ChatRequest, ChatResponse, DetectionResponse
    from .services.image_processing import image_service
except ImportError:  # pragma: no cover
    from llm_router import llm_router
    from rag_client import rag_client
    from app_utils import get_logger
    from models.schemas import ChatRequest, ChatResponse, DetectionResponse
    from services.image_processing import image_service

# Load .env: prefer backend/.env, fall back to root .env
_backend_env = Path(__file__).with_name(".env")
_root_env = Path(__file__).parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(_backend_env, override=False)
elif _root_env.exists():
    load_dotenv(_root_env, override=False)
else:
    load_dotenv(override=False)

logger = get_logger("backend.main")

app = FastAPI(
    title="eCropGuard AI Backend",
    description="Multi-model agricultural AI: chat, RAG, and crop disease detection.",
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


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    return {"status": "ok", "message": "eCropGuard AI backend is running."}


@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Chat  (multi-model, Groq)
# ---------------------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest) -> ChatResponse:
    """Return responses from multiple LLMs for a given agricultural query."""
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


# ---------------------------------------------------------------------------
# RAG-enhanced chat
# ---------------------------------------------------------------------------

@app.post("/rag-query", response_model=ChatResponse, tags=["RAG"])
async def rag_query(request: ChatRequest) -> ChatResponse:
    """Return RAG-augmented multi-model responses."""
    logger.info("/rag-query request received")
    try:
        context = await rag_client.fetch_context(request.query, request.lang)
        responses, best = await llm_router.get_multi_response(
            query=request.query,
            lang=request.lang,
            context=context,
        )
        rag_used = len(context.strip()) > 0
        return ChatResponse(
            responses=responses,
            best=best,
            rag_used=rag_used,
            rag_context_length=len(context),
            raw_context=context,
        )
    except ValueError as exc:
        logger.warning("/rag-query validation failure: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("/rag-query failed")
        raise HTTPException(status_code=500, detail="Failed to generate RAG responses.") from exc


# ---------------------------------------------------------------------------
# Disease Detection  (Gemini Vision)
# ---------------------------------------------------------------------------

@app.post("/detect-disease", response_model=DetectionResponse, tags=["Detection"])
async def detect_disease(
    file: UploadFile = File(..., description="Crop image (JPG/PNG)"),
    language: str = Form(default="en", description="Response language: en | hi | mr"),
) -> DetectionResponse:
    """Analyze a crop image for disease using Gemini 2.0 Flash vision."""
    logger.info("/detect-disease request received — file: %s, lang: %s", file.filename, language)
    try:
        result = await image_service.process_image(file, language)
        return result
    except ValueError as exc:
        logger.warning("/detect-disease validation failure: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("/detect-disease failed")
        raise HTTPException(status_code=500, detail="Failed to analyze image.") from exc


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
