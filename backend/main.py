"""Main FastAPI Application Entry Point."""

import os
import time
import uuid
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError, BaseModel

from models.schemas import (
    ChatRequest, ChatResponse, DetectionResponse,
    ModelListResponse, SoilRequest, SoilAnalysisResponse, SoilHistoryItem,
    Advisory, MarketPrice, ForumPostCreate, ForumReplyCreate,
)
from llm_router import llm_router
from app_utils import get_logger
from services.image_processing import image_service
from rag import rag_engine

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
# Supabase client (shared across routes)
# ---------------------------------------------------------------------------

_supabase = None


def get_supabase():
    global _supabase
    if _supabase is not None:
        return _supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB routes will degrade gracefully.")
        return None
    try:
        from supabase import create_client
        _supabase = create_client(url, key)
        logger.info("Supabase client initialised.")
    except Exception as exc:
        logger.error("Failed to create Supabase client: %s", exc)
    return _supabase


# ---------------------------------------------------------------------------
# Simple in-memory cache (replaces Redis for advisory/market caching)
# ---------------------------------------------------------------------------

_cache: Dict[str, Dict[str, Any]] = {}


def cache_get(key: str, ttl_seconds: int) -> Optional[Any]:
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < ttl_seconds:
        return entry["data"]
    return None


def cache_set(key: str, data: Any) -> None:
    _cache[key] = {"data": data, "ts": time.time()}


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

def detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["translate", "marathi name", "hindi name", "english name", "mean in", "what is"]):
        if re.search(r'\b(in marathi|in hindi|in english|marathi name|hindi name)\b', q):
            return "translation"
        if len(q.split()) < 6 and any(w in q for w in ["name", "meaning"]):
            return "translation"
    if any(w in q for w in ["disease", "symptom", "blight", "mildew", "rot", "spot", "bhuri", "karpa"]):
        return "disease_info"
    if any(w in q for w in ["treat", "cure", "pesticide", "control", "prevent"]):
        return "treatment"
    return "general"

@app.post("/rag-query", tags=["AI Chat"])
async def handle_rag_query(
    request: Request,
    query: Optional[str] = Form(None),
    lang: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """Multimodal RAG query. Detects JSON vs Form-Data automatically."""
    # 1. Capture inputs from Form-Data (if any)
    q = query
    l = lang or "en"
    loc = location

    # 2. Try JSON fallback if not found in Form-Data
    if not q:
        try:
            body = await request.json()
            q = body.get("query")
            l = body.get("lang", l)
            loc = body.get("location", loc)
        except:
            pass # Not a JSON request/body

    # 3. Final validation
    if not q and not image:
        raise HTTPException(status_code=422, detail="No query or image provided.")
    
    # Ensure lang is always set for API calls
    if not l: l = "en"
    
    logger.info("Chat Request: q=%s l=%s img=%s", (q or "")[:30], l, bool(image))
    
    try:
        image_desc = ""
        # 4. Multimodal Logic (Image described to reasoning core)
        if image:
            logger.info("Processing Image with Vision model...")
            vision_result = await image_service.process_image(image, l)
            image_desc = f"\n[IMAGE ANALYSIS: {vision_result.description}. Observed Symptoms: {', '.join(vision_result.symptoms)}]"
            if not q: q = "What is wrong with this plant?"
        
        # 5. Enhanced query for RAG
        enhanced_query = f"{q} {image_desc}".strip()
        intent = detect_intent(enhanced_query)
        
        context = ""
        rag_used = False
        if intent != "translation":
            context = rag_engine.search(enhanced_query, location=loc)
            if len(context) > 8000:
                context = context[:8000] + "...\n[Context Truncated]"
        
        if len(context) > 100:
            rag_used = True
        else:
            context = ""

        # 4. Get responses
        all_responses, best = await llm_router.get_multi_response(
            query=enhanced_query,
            lang=l,
            context=context,
            location=loc
        )

        # 5. GPT-style Image Generation (Ref. images based on disease detection)
        image_url = None
        lowered_best = best.text.lower()
        
        # Powdery Mildew / Bhuri
        if any(w in lowered_best for w in ["bhuri", "powdery mildew", "भुरी", "पावडरी"]):
            image_url = "https://images.unsplash.com/photo-1599419844280-c11c7df0e764?auto=format&fit=crop&q=80&w=800"
        
        # Blight / Karpa / Tila
        elif any(w in lowered_best for w in ["blight", "karpa", "tila", "करपा", "तिळा", "बुरशी"]):
            image_url = "https://images.unsplash.com/photo-1598214886806-c87b8a5c291b?auto=format&fit=crop&q=80&w=800"
        
        # Tomato specific
        elif "tomato" in lowered_best or "टमाटर" in lowered_best:
            image_url = "https://images.unsplash.com/photo-1592841200221-a6898f307bac?auto=format&fit=crop&q=80&w=800"
        
        # Pests / Insects
        elif any(w in lowered_best for w in ["pest", "insect", "कीड", "अळी"]):
            image_url = "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=800"

        # 6. Construct production response
        return {
            "query": q,
            "responses": [r.model_dump() for r in all_responses],
            "best": best.model_dump(),
            "rag_used": rag_used,
            "rag_context_length": len(context),
            "image_url": image_url
        }
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
        result = await image_service.process_image(image, lang)
        return result
    except Exception as e:
        logger.error("Image Analysis Error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/disease/history/{user_id}", response_model=List[Dict[str, Any]], tags=["Plant Pathology"])
async def get_disease_history(user_id: str):
    """Retrieves historical crop diagnostic records. Currently returning empty mock to prevent UI crashes."""
    return []

# ---------------------------------------------------------------------------
# Soil Dynamics Routes — now backed by real DB
# ---------------------------------------------------------------------------

@app.post("/api/soil/analyze", response_model=SoilAnalysisResponse, tags=["Soil Science"])
async def analyze_soil_metrics(req: SoilRequest):
    """Analyzes Soil NPK and pH data for optimal crop growth. Saves result to DB."""
    logger.info("Soil Analysis Request: ID %s", req.user_id)

    n, p, k, ph = req.nitrogen, req.phosphorus, req.potassium, req.ph

    score = 100
    recs = []

    # Agronomic logic (unchanged)
    if n < 30: score -= 15; recs.append("Apply urea or organic nitrogen-rich manure.")
    if p < 20: score -= 10; recs.append("Add phosphorus-based fertilizers or bone meal.")
    if ph < 6.0: score -= 15; recs.append("Soil is acidic; consider lime application.")
    elif ph > 7.5: score -= 15; recs.append("Soil is alkaline; consider sulfur or gypsum.")

    health_score = max(0, score)
    recommendations = recs or ["Soil is in excellent condition. Maintain current organic practices."]
    advisory = "AI analysis suggests periodic moisture monitoring to maintain nutrient bioavailability."
    n_status = "Low" if n < 30 else "Optimal" if n < 70 else "High"
    p_status = "Low" if p < 20 else "Optimal" if p < 50 else "High"
    k_status = "Low" if k < 20 else "Optimal" if k < 50 else "High"
    ph_status = "Acidic" if ph < 6.0 else "Neutral" if ph < 7.5 else "Alkaline"

    # --- Persist to DB ---
    saved_id: Optional[str] = None
    try:
        client = get_supabase()
        if client and req.user_id:
            row = {
                "user_id": req.user_id,
                "nitrogen": n,
                "phosphorus": p,
                "potassium": k,
                "ph": ph,
                "moisture": getattr(req, "moisture", None),
                "organic_matter": getattr(req, "organic_matter", None),
                "health_score": health_score,
                "recommendations": recommendations,
                "advisory": advisory,
                "nitrogen_status": n_status,
                "phosphorus_status": p_status,
                "potassium_status": k_status,
                "ph_status": ph_status,
                "region": "maharashtra",
            }
            result = client.table("soil_analyses").insert(row).execute()
            data = getattr(result, "data", None)
            if data and len(data) > 0:
                saved_id = str(data[0].get("id", ""))
                logger.info("Soil analysis saved to DB: %s", saved_id)
        elif not req.user_id:
            logger.info("No user_id provided — soil result not persisted.")
    except Exception as exc:
        # Never block the user from getting their score
        logger.error("Failed to save soil analysis to DB: %s", exc)

    return SoilAnalysisResponse(
        health_score=health_score,
        recommendations=recommendations,
        advisory=advisory,
        nitrogen_status=n_status,
        phosphorus_status=p_status,
        potassium_status=k_status,
        ph_status=ph_status,
        saved_id=saved_id,
    )


@app.get("/api/soil/history/{user_id}", response_model=List[SoilHistoryItem], tags=["Soil Science"])
async def get_soil_history(user_id: str):
    """Retrieves historical soil diagnostic records from Supabase."""
    try:
        client = get_supabase()
        if not client:
            raise HTTPException(status_code=503, detail="Database unavailable.")

        result = (
            client.table("soil_analyses")
            .select("id, nitrogen, phosphorus, potassium, ph, health_score, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        rows = getattr(result, "data", None) or []

        return [
            SoilHistoryItem(
                id=str(row["id"]),
                timestamp=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
                nitrogen=row.get("nitrogen") or 0.0,
                phosphorus=row.get("phosphorus") or 0.0,
                potassium=row.get("potassium") or 0.0,
                ph=row.get("ph") or 7.0,
                soil_health_score=int(row.get("health_score") or 0),
            )
            for row in rows
        ]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_soil_history error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch soil history.")


# ---------------------------------------------------------------------------
# Advisories Routes (Feature 4)
# ---------------------------------------------------------------------------

@app.get("/api/advisories", response_model=List[Advisory], tags=["Advisories"])
async def get_advisories(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
):
    """Returns advisories filtered by state/district, sorted by severity DESC."""
    cache_key = f"advisories:{state}:{district}"
    cached = cache_get(cache_key, ttl_seconds=600)  # 10 minutes
    if cached is not None:
        logger.info("Advisories served from cache.")
        return cached

    try:
        client = get_supabase()
        if not client:
            raise HTTPException(status_code=503, detail="Database unavailable.")

        query = client.table("advisories").select("*")

        # Filter: target_states contains the state param
        if state:
            query = query.contains("target_states", [state])

        result = query.order("created_at", desc=True).limit(50).execute()
        rows = getattr(result, "data", None) or []

        # Optional district filter (client-side, since JSONB array contains is harder)
        if district:
            rows = [
                r for r in rows
                if (r.get("target_districts") is None
                    or district in (r.get("target_districts") or []))
            ]

        advisories = [
            Advisory(
                id=str(r["id"]),
                title=r["title"],
                body=r["body"],
                severity=r.get("severity", "info"),
                target_states=r.get("target_states"),
                target_districts=r.get("target_districts"),
                created_at=datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")) if r.get("created_at") else None,
            )
            for r in rows
        ]

        # Sort by severity
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
        advisories.sort(key=lambda a: (severity_order.get(a.severity, 9), a.created_at or datetime.min))

        cache_set(cache_key, [a.model_dump() for a in advisories])
        return advisories
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_advisories error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch advisories.")


# ---------------------------------------------------------------------------
# Market Prices Route (Feature 5)
# ---------------------------------------------------------------------------

AGMARKNET_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

@app.get("/api/market/prices", response_model=Dict[str, Any], tags=["Market Prices"])
async def get_market_prices(
    commodity: str = Query("Cotton"),
    state: str = Query("Maharashtra"),
    district: Optional[str] = Query(None),
):
    """Fetches mandi prices from Agmarknet (data.gov.in). Caches 1 hour."""
    cache_key = f"market:{commodity}:{state}:{district}"
    cached = cache_get(cache_key, ttl_seconds=3600)
    if cached is not None:
        logger.info("Market prices served from cache.")
        return cached

    api_key = os.getenv("DATA_GOV_API_KEY", "579b464db66ec23d21000186")  # public demo key
    params: Dict[str, Any] = {
        "api-key": api_key,
        "format": "json",
        "limit": 20,
        "filters[commodity]": commodity,
        "filters[state]": state,
    }
    if district:
        params["filters[district]"] = district

    stale = False
    prices: List[Dict] = []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(AGMARKNET_API_URL, params=params)
            resp.raise_for_status()
            raw = resp.json()
            records = raw.get("records", [])

            prices = [
                {
                    "commodity": r.get("commodity", commodity),
                    "market": r.get("market", ""),
                    "min_price": _safe_float(r.get("min_price")),
                    "max_price": _safe_float(r.get("max_price")),
                    "modal_price": _safe_float(r.get("modal_price")),
                    "date": r.get("arrival_date", ""),
                    "unit": r.get("grade", "Quintal"),
                    "state": r.get("state", state),
                    "district": r.get("district", district or ""),
                }
                for r in records
            ]

            cache_set(cache_key, {"prices": prices, "stale": False, "commodity": commodity, "state": state})
            logger.info("Market prices fetched: %d records.", len(prices))
    except Exception as exc:
        logger.error("Agmarknet API error: %s", exc)
        stale_entry = _cache.get(cache_key)
        if stale_entry:
            logger.info("Returning stale cached market data.")
            stale_entry["data"]["stale"] = True
            return stale_entry["data"]
        return {
            "prices": [],
            "stale": False,
            "commodity": commodity,
            "state": state,
            "message": f"Market data temporarily unavailable: {exc}",
        }

    return {"prices": prices, "stale": stale, "commodity": commodity, "state": state}


def _safe_float(val: Any) -> Optional[float]:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Forum Routes (Feature 6)
# ---------------------------------------------------------------------------

@app.get("/api/forums/posts", tags=["Forums"])
async def get_forum_posts(
    crop: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
):
    """Returns paginated forum posts."""
    try:
        client = get_supabase()
        if not client:
            raise HTTPException(status_code=503, detail="Database unavailable.")

        limit = 20
        offset = (page - 1) * limit

        query = client.table("forum_posts").select(
            "id, title, body, crop_type, district, upvotes, created_at, user_id"
        )
        if crop:
            query = query.ilike("crop_type", f"%{crop}%")
        if district:
            query = query.ilike("district", f"%{district}%")

        result = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        rows = getattr(result, "data", None) or []
        return {"posts": rows, "page": page}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_forum_posts error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch forum posts.")


@app.post("/api/forums/posts", tags=["Forums"])
async def create_forum_post(req: ForumPostCreate):
    """Creates a new forum post."""
    try:
        client = get_supabase()
        if not client:
            raise HTTPException(status_code=503, detail="Database unavailable.")

        row = {
            "title": req.title,
            "body": req.body,
            "crop_type": req.crop_type,
            "district": req.district,
            "upvotes": 0,
        }
        if req.user_id:
            row["user_id"] = req.user_id

        result = client.table("forum_posts").insert(row).execute()
        data = getattr(result, "data", None) or []
        return data[0] if data else {"message": "Post created but no data returned."}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("create_forum_post error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create forum post.")


@app.get("/api/forums/posts/{post_id}/replies", tags=["Forums"])
async def get_forum_replies(post_id: str):
    """Returns replies for a forum post."""
    try:
        client = get_supabase()
        if not client:
            raise HTTPException(status_code=503, detail="Database unavailable.")

        result = (
            client.table("forum_replies")
            .select("id, post_id, body, is_expert, created_at, user_id")
            .eq("post_id", post_id)
            .order("created_at")
            .execute()
        )
        rows = getattr(result, "data", None) or []
        return {"replies": rows}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_forum_replies error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch replies.")


@app.post("/api/forums/posts/{post_id}/replies", tags=["Forums"])
async def create_forum_reply(post_id: str, req: ForumReplyCreate):
    """Creates a reply to a forum post."""
    try:
        client = get_supabase()
        if not client:
            raise HTTPException(status_code=503, detail="Database unavailable.")

        row = {
            "post_id": post_id,
            "body": req.body,
            "is_expert": False,
        }
        if req.user_id:
            row["user_id"] = req.user_id

        result = client.table("forum_replies").insert(row).execute()
        data = getattr(result, "data", None) or []
        return data[0] if data else {"message": "Reply created."}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("create_forum_reply error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create reply.")


@app.post("/api/forums/posts/{post_id}/upvote", tags=["Forums"])
async def upvote_forum_post(post_id: str):
    """Upvotes a forum post (increments counter)."""
    try:
        client = get_supabase()
        if not client:
            raise HTTPException(status_code=503, detail="Database unavailable.")

        # Fetch current votes
        result = client.table("forum_posts").select("upvotes").eq("id", post_id).execute()
        rows = getattr(result, "data", None) or []
        if not rows:
            raise HTTPException(status_code=404, detail="Post not found.")

        current = rows[0].get("upvotes") or 0
        update_result = (
            client.table("forum_posts")
            .update({"upvotes": current + 1})
            .eq("id", post_id)
            .execute()
        )
        data = getattr(update_result, "data", None) or []
        return {"upvotes": (data[0].get("upvotes") if data else current + 1)}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("upvote_forum_post error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to upvote post.")


# ---------------------------------------------------------------------------
# System Routes (unchanged)
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
