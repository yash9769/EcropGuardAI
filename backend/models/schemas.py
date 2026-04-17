"""Pydantic schemas for eCropGuard AI backend."""

from typing import Any, Dict, List, Optional
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Chat / RAG
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="User's agricultural question")
    lang: str = Field(default="en", pattern="^(en|hi|mr)$", description="Response language")
    location: Optional[str] = Field(default=None, max_length=200, description="User's location for regional RAG")

    @field_validator("query")
    @classmethod
    def strip_query(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Query cannot be empty or whitespace.")
        return stripped


class LLMResponse(BaseModel):
    model: str
    text: str


class ChatResponse(BaseModel):
    responses: List[LLMResponse]
    best: LLMResponse
    rag_used: bool = False
    rag_context_length: int = 0
    raw_context: Optional[str] = None
    image_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Disease Detection
# ---------------------------------------------------------------------------

class DetectionResponse(BaseModel):
    disease_name: str
    crop_type: str
    confidence: int = Field(ge=0, le=100)
    severity: str = Field(pattern="^(low|medium|high|critical)$")
    description: str
    symptoms: List[str] = []
    causes: List[str] = []
    recommendations: List[str] = []
    treatment_steps: List[str] = []
    prevention_tips: List[str] = []
    is_healthy: bool
    # Advanced fields
    impact: Optional[str] = None
    organic_controls: Optional[List[str]] = None
    fuzzy_confidence: Optional[str] = None
    uncertainty_message: Optional[str] = None


# ---------------------------------------------------------------------------
# Soil Metrics
# ---------------------------------------------------------------------------

class SoilRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200)
    phosphorus: float = Field(..., ge=0, le=200)
    potassium: float = Field(..., ge=0, le=200)
    ph: float = Field(..., ge=0, le=14)
    organic_matter: float = Field(..., ge=0, le=20)
    user_id: Optional[str] = None


class SoilAnalysisResponse(BaseModel):
    health_score: int = Field(ge=0, le=100)
    recommendations: List[str]
    advisory: str
    nitrogen_status: str
    phosphorus_status: str
    potassium_status: str
    ph_status: str
    saved_id: Optional[str] = None  # UUID of the saved row, if DB write succeeded


class SoilHistoryItem(BaseModel):
    id: str
    timestamp: datetime
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    soil_health_score: int


# ---------------------------------------------------------------------------
# Advisories
# ---------------------------------------------------------------------------

class Advisory(BaseModel):
    id: str
    title: str
    body: str
    severity: str = "info"
    target_states: Optional[List[str]] = None
    target_districts: Optional[List[str]] = None
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Market Prices
# ---------------------------------------------------------------------------

class MarketPrice(BaseModel):
    commodity: str
    market: str
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    modal_price: Optional[float] = None
    date: Optional[str] = None
    unit: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None


# ---------------------------------------------------------------------------
# Forum
# ---------------------------------------------------------------------------

class ForumPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1)
    crop_type: Optional[str] = None
    district: Optional[str] = None
    user_id: Optional[str] = None


class ForumReplyCreate(BaseModel):
    body: str = Field(..., min_length=1)
    user_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Model Management
# ---------------------------------------------------------------------------

class ModelListResponse(BaseModel):
    models: Dict[str, Any]
