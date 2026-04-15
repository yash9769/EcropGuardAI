import os
import io
import json
import base64
import google.generativeai as genai
from fastapi import UploadFile
from PIL import Image

from backend.models.schemas import DetectionResponse
from backend.utils.logger import logger

class ImageService:
    def __init__(self):
        self._api_key = os.getenv("GEMINI_API_KEY")
        if self._api_key:
            genai.configure(api_key=self._api_key)
            self._model = genai.GenerativeModel('gemini-2.0-flash')
        else:
            self._model = None
            logger.warning("GEMINI_API_KEY not found. Disease detection will be unavailable.")

    async def process_image(self, file: UploadFile, language: str = "en") -> DetectionResponse:
        """
        Analyze the image using Gemini 2.0 Flash and return a structured diagnosis.
        """
        if not self._model:
            raise ValueError("Gemini API is not configured on the server.")

        raw_bytes = await file.read()
        
        # Verify it's a valid image
        try:
            Image.open(io.BytesIO(raw_bytes))
        except Exception as exc:
            raise ValueError(f"Invalid image file: {exc}")

        language_map = {
            "en": "English", "hi": "Hindi", "mr": "Marathi"
        }
        target_lang = language_map.get(language, "English")

        prompt = f"""
        You are an expert agricultural scientist and plant pathologist. 
        Analyze this crop/plant image carefully and provide a detailed diagnosis in {target_lang}.

        Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact structure:
        {{
          "disease_name": "Name of disease or 'Healthy Crop' if no disease",
          "crop_type": "Type of crop/plant detected",
          "confidence": 85,
          "severity": "low|medium|high|critical",
          "description": "Brief description of the condition in 1-2 sentences",
          "symptoms": ["symptom1", "symptom2", "symptom3"],
          "causes": ["cause1", "cause2"],
          "recommendations": ["action1", "action2", "action3"],
          "treatment_steps": ["step1", "step2", "step3", "step4"],
          "prevention_tips": ["tip1", "tip2", "tip3"],
          "is_healthy": false,
          "impact": "predicted yield impact description",
          "organic_controls": ["organic_action1", "organic_action2"]
        }}

        Rules:
        - confidence is 0-100 integer
        - severity must be exactly one of: low, medium, high, critical
        - If crop is healthy, set is_healthy: true, severity: "low", disease_name: "Healthy Crop"
        - Provide practical, actionable advice for small-scale farmers in {target_lang}.
        """

        try:
            # Prepare image for Gemini
            image_data = {
                'mime_type': file.content_type or 'image/jpeg',
                'data': raw_bytes
            }

            response = await self._model.generate_content_async(
                contents=[prompt, image_data]
            )

            text = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)

            return DetectionResponse(**data)

        except Exception as exc:
            logger.error(f"Gemini processing error: {exc}")
            # Fallback if AI fails partially or returns bad JSON
            return DetectionResponse(
                disease_name="Analysis Error",
                crop_type="Unknown",
                confidence=0,
                severity="low",
                description="The AI service encountered an error processing your image.",
                symptoms=[],
                causes=[],
                recommendations=["Please try again later."],
                treatment_steps=[],
                prevention_tips=[],
                is_healthy=False
            )

# Module-level singleton
image_service = ImageService()
