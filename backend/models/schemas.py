from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Chat / RAG
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    query: str
    lang: str = Field(default="en", pattern="^(en|hi|mr)$")


class LLMResponse(BaseModel):
    model: str
    text: str


class ChatResponse(BaseModel):
    responses: List[LLMResponse]
    best: LLMResponse
    rag_used: bool = False
    rag_context_length: int = 0
    raw_context: Optional[str] = None


# ---------------------------------------------------------------------------
# Disease Detection
# ---------------------------------------------------------------------------
class DetectionResponse(BaseModel):
    disease_name: str
    crop_type: str
    confidence: int
    severity: str
    description: str
    symptoms: List[str]
    causes: List[str]
    recommendations: List[str]
    treatment_steps: List[str]
    prevention_tips: List[str]
    is_healthy: bool
    # Advanced fields
    impact: str | None = None
    organic_controls: List[str] | None = None
    fuzzy_confidence: str | None = None
    uncertainty_message: str | None = None


# ---------------------------------------------------------------------------
# Model Management
# ---------------------------------------------------------------------------
class ModelListResponse(BaseModel):
    models: Dict[str, Any]
