"""Main FastAPI Application Entry Point."""

import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from models.schemas import (
    ChatRequest, ChatResponse, DetectionResponse, 
    ModelListResponse, SoilRequest, SoilAnalysisResponse, SoilHistoryItem
)
from llm_router import llm_router
from app_utils import get_logger
# from services.image_processing import process_image_analysis  -- Removed broken import

# Initialize 
logger = get_logger("backend.main")
app = FastAPI(
    title="eCropGuard AI Backend",
    description="Production-ready agricultural AI backend with RAG and vision support.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: restricted to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())
    logger.error("Internal Server Error (ID: %s) on %s: %s", error_id, request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error_id": error_id,
            "message": "A critical system error occurred. Please contact eCropGuard support with the error ID.",
            "detail": str(exc) if os.getenv("DEBUG") else "Internal Server Error"
        }
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.warning("Validation Error on %s: %s", request.url.path, str(exc))
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "message": "The format of the request was invalid."
        }
    )

# ---------------------------------------------------------------------------
# Core AI Routes
# ---------------------------------------------------------------------------

from rag import rag_engine

@app.post("/rag-query", response_model=ChatResponse, tags=["AI Chat"])
async def handle_rag_query(req: ChatRequest):
    """Answers agricultural queries with local research context and multi-model verification."""
    logger.info("Chat Request: %s (Lang: %s, Location: %s)", req.query[:50], req.lang, req.location)
    try:
        # 1. Retrieve regional RAG context
        context = rag_engine.search(req.query, location=req.location)
        
        # 2. Get parallel model responses
        all_responses, best = await llm_router.get_multi_response(
            query=req.query, 
            lang=req.lang, 
            context=context, 
            location=req.location
        )
        
        # 3. Construct production response
        return ChatResponse(
            responses=all_responses,
            best=best,
            rag_used=bool(context),
            rag_context_length=len(context),
            raw_context=context if os.getenv("DEBUG") else None
        )
    except Exception as e:
        logger.error("RAG Query Error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


from services.image_processing import image_service

@app.post("/analyze-disease", response_model=DetectionResponse, tags=["Plant Pathology"])
async def handle_analyze_disease(image: UploadFile = File(...), lang: str = Query("en")):
    """Diagnoses crop diseases from uploaded images using Gemini vision models."""
    logger.info("Disease Analysis Request: %s (%s, Lang: %s)", image.filename, image.content_type, lang)
    
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    
    try:
        # Pass the UploadFile directly to the service
        result = await image_service.process_image(image, lang)
        return result
    except Exception as e:
        logger.error("Image Analysis Error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Soil Dynamics Routes
# ---------------------------------------------------------------------------

@app.post("/api/soil/analyze", response_model=SoilAnalysisResponse, tags=["Soil Science"])
async def analyze_soil_metrics(req: SoilRequest):
    """Analyzes Soil NPK and pH data for optimal crop growth."""
    logger.info("Soil Analysis Request: ID %s", req.user_id)
    
    # Production: Replace with real agronomic AI logic
    # For now, using sophisticated threshold logic
    n, p, k, ph = req.nitrogen, req.phosphorus, req.potassium, req.ph
    
    score = 100
    recs = []
    
    # Simplified agronomic logic
    if n < 30: score -= 15; recs.append("Apply urea or organic nitrogen-rich manure.")
    if p < 20: score -= 10; recs.append("Add phosphorus-based fertilizers or bone meal.")
    if ph < 6.0: score -= 15; recs.append("Soil is acidic; consider lime application.")
    elif ph > 7.5: score -= 15; recs.append("Soil is alkaline; consider sulfur or gypsum.")
    
    return SoilAnalysisResponse(
        health_score=max(0, score),
        recommendations=recs or ["Soil is in excellent condition. Maintain current organic practices."],
        advisory="AI analysis suggests periodic moisture monitoring to maintain nutrient bioavailability.",
        nitrogen_status="Low" if n < 30 else "Optimal" if n < 70 else "High",
        phosphorus_status="Low" if p < 20 else "Optimal" if p < 50 else "High",
        potassium_status="Low" if k < 20 else "Optimal" if k < 50 else "High",
        ph_status="Acidic" if ph < 6.0 else "Neutral" if ph < 7.5 else "Alkaline"
    )

@app.get("/api/soil/history/{user_id}", response_model=List[SoilHistoryItem], tags=["Soil Science"])
async def get_soil_history(user_id: str):
    """Retrieves historical soil diagnostic records."""
    # Production: Fetch from Supabase PG or Vector store
    return [
        SoilHistoryItem(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            nitrogen=45.0,
            phosphorus=25.0,
            potassium=30.0,
            ph=6.5,
            soil_health_score=88
        )
    ]

# ---------------------------------------------------------------------------
# System Routes
# ---------------------------------------------------------------------------

@app.get("/models", response_model=ModelListResponse, tags=["System"])
async def list_models():
    """Lists currently active AI models in the orchestration layer."""
    return {"models": llm_router.models}

@app.get("/health", tags=["System"])
async def health_check():
    """Service availability check."""
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # Pre-loading checks could go here
    uvicorn.run(app, host="0.0.0.0", port=8000)
