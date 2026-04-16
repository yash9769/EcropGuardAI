"""Disease Detection Service using Gemini Vision 2.0 Flash."""

import io
import json
import os
from typing import Dict, Any, List

import google.generativeai as genai
from fastapi import UploadFile
from PIL import Image

try:
    from ..models.schemas import DetectionResponse
    from ..utils.logger import logger
except ImportError:  # pragma: no cover
    from models.schemas import DetectionResponse
    from utils.logger import logger


class ImageService:
    def __init__(self) -> None:
        self._api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if self._api_key:
            genai.configure(api_key=self._api_key)
            self._model = genai.GenerativeModel("gemini-1.5-flash") # Use 1.5-flash or 2.0-flash
            logger.info("Gemini Vision Service initialized.")
        else:
            self._model = None
            logger.warning("GEMINI_API_KEY is missing. Disease detection disabled.")

    async def process_image(self, file: UploadFile, language: str = "en") -> DetectionResponse:
        """Analyze a crop image and return a structured agricultural diagnosis."""
        if not self._model:
            raise ValueError("Cloud AI visual core not configured. Set GEMINI_API_KEY.")

        raw_bytes = await file.read()
        
        # Local validation
        try:
            img = Image.open(io.BytesIO(raw_bytes))
            if img.width < 100 or img.height < 100:
                raise ValueError("Image resolution is too low for accurate analysis.")
        except Exception as exc:
            raise ValueError(f"Invalid image content: {exc}")

        language_map = {"en": "English", "hi": "Hindi", "mr": "Marathi"}
        target_lang = language_map.get(language, "English")

        prompt = f"""
        You are a PhD plant pathologist and field agronomist.
        Analyze this agricultural image meticulously. Identify the crop type and any diseases or deficiencies.
        
        Provide advice for small-scale farmers in {target_lang}.
        If the crop is healthy, provide maintenance tips. If diseased, provide remedial actions.
        
        Respond ONLY with a JSON object (no talk, no markdown fences) with this structure:
        {{
          "disease_name": "string",
          "crop_type": "string",
          "confidence": number (0-100),
          "severity": "low|medium|high|critical",
          "description": "string (2 sentences)",
          "symptoms": ["string"],
          "causes": ["string"],
          "recommendations": ["string"],
          "treatment_steps": ["step-by-step guidance"],
          "prevention_tips": ["string"],
          "is_healthy": boolean,
          "impact": "predicted yield impact",
          "organic_controls": ["non-chemical alternatives"]
        }}
        """

        try:
            image_data = {
                "mime_type": file.content_type or "image/jpeg",
                "data": raw_bytes,
            }

            # Async AI call
            response = await self._model.generate_content_async(
                contents=[prompt, image_data]
            )
            
            # Sanitise JSON response
            raw_text = response.text.strip()
            # Clean possible markdown block markers
            clean_json = re.sub(r"```json|```", "", raw_text).strip()
            
            data = json.loads(clean_json)
            
            # Fill missing required fields if any (fallback)
            for field in ["symptoms", "causes", "recommendations", "treatment_steps", "prevention_tips"]:
                if field not in data:
                    data[field] = []

            return DetectionResponse(**data)

        except json.JSONDecodeError:
            logger.error("AI returned malformed JSON from visual analysis.")
            raise ValueError("Failure to parse AI visual diagnostic. Please try again.")
        except Exception as exc:
            logger.error("Visual diagnostic service error: %s", exc)
            raise


# Helper needed for the regex cleaning
import re

# Module-level singleton
image_service = ImageService()
