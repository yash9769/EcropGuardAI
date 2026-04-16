"""Parallel Groq-based router for multi-model agricultural responses."""

import asyncio
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

from dotenv import load_dotenv
from groq import AsyncGroq

try:
    from .app_utils import SUPPORTED_LANGUAGES, get_logger, pick_best, translate_text_if_needed
    from .models.schemas import LLMResponse
except ImportError:  # pragma: no cover
    from app_utils import SUPPORTED_LANGUAGES, get_logger, pick_best, translate_text_if_needed
    from models.schemas import LLMResponse

# Load env from backend dir, then root
_env = Path(__file__).with_name(".env")
if _env.exists():
    load_dotenv(_env, override=False)
else:
    load_dotenv(override=False)

logger = get_logger("backend.llm_router")


@dataclass(frozen=True)
class ModelConfig:
    public_name: str
    model_id: str
    temperature: float = 0.3
    max_tokens: int = 800


# Models available on Groq – add/remove freely
MODEL_REGISTRY: Tuple[ModelConfig, ...] = (
    ModelConfig(public_name="llama", model_id="llama-3.3-70b-versatile"),
    ModelConfig(public_name="qwen",  model_id="qwen/qwen3-32b"),
)

SYSTEM_PROMPT = (
    "You are eCropGuard AI, an elite agricultural research assistant trusted by millions of Indian farmers. "
    "Your advice is evidence-based, practical, and region-specific. "
    "\n\nKEY RULES:"
    "\n1. If 'Context' is provided in the user message, you MUST use it as the primary source of truth and explicitly reference it. "
    "Start your response with a phrase like 'Based on research data for your region...' or 'According to agricultural records...'."
    "\n2. If context contains regional markers [MH] (Maharashtra) or [HR] (Haryana), tailor ALL advice specifically to that region's soil, climate, and crops."
    "\n3. Structure responses with **bold section headers**, bullet points, and numbered steps for easy reading."
    "\n4. Always include: Cause, Symptoms to look for, Immediate treatment, and Prevention steps."
    "\n5. Use simple, farmer-friendly language. Avoid jargon unless followed by a plain explanation."
)


class LLMRouter:
    def __init__(self) -> None:
        self._client: Optional[AsyncGroq] = None

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            api_key = (os.getenv("GROQ_API_KEY") or "").strip()
            if not api_key:
                raise ValueError(
                    "GROQ_API_KEY is not set. Add it to backend/.env or your environment."
                )
            self._client = AsyncGroq(api_key=api_key)
        return self._client

    async def get_multi_response(
        self,
        query: str,
        lang: str = "en",
        context: str = "",
        location: Optional[str] = None,
    ) -> Tuple[List[LLMResponse], LLMResponse]:
        if not query.strip():
            raise ValueError("Query cannot be empty.")
        if lang not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language '{lang}'. Supported: {list(SUPPORTED_LANGUAGES)}.")

        prompt = self._build_prompt(query=query, context=context, location=location)
        tasks = [self._call_model(cfg, prompt, lang) for cfg in MODEL_REGISTRY]
        responses: List[LLMResponse] = list(await asyncio.gather(*tasks))

        # Filter out total failures before picking best
        valid = [r for r in responses if not r.text.startswith("Model unavailable")]
        if not valid:
            valid = responses  # Don't leave caller empty-handed even if all failed

        best = pick_best(valid)
        return responses, best

    def _build_prompt(self, query: str, context: str, location: Optional[str] = None) -> str:
        """Construct the user-turn prompt with optional location and RAG context."""
        parts: List[str] = []
        if location:
            parts.append(f"User Location: {location.strip()}")
        if context.strip():
            parts.append(
                f"Context (retrieved agricultural research — treat as ground truth):\n{context.strip()}"
            )
        parts.append(f"Question: {query.strip()}")
        return "\n\n".join(parts)

    async def _call_model(
        self,
        config: ModelConfig,
        prompt: str,
        lang: str,
    ) -> LLMResponse:
        try:
            completion = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=config.model_id,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens,
                    messages=[
                        {"role": "system", "content": self._system_message(lang)},
                        {"role": "user",   "content": prompt},
                    ],
                ),
                timeout=25,
            )
            raw = completion.choices[0].message.content or ""
            text = self._clean_response(raw)
            text = await translate_text_if_needed(
                text=text,
                target_lang=lang,
                groq_client=self.client,
            )
            logger.info("%s → %d chars", config.public_name, len(text))
            return LLMResponse(model=config.public_name, text=text)

        except asyncio.TimeoutError:
            logger.warning("%s timed out after 25s", config.public_name)
            return LLMResponse(model=config.public_name, text="Request timed out. Please try again.")
        except Exception as exc:
            logger.error("%s failed: %s", config.public_name, exc)
            return LLMResponse(model=config.public_name, text=f"Model unavailable: {exc}")

    def _system_message(self, lang: str) -> str:
        language_name = SUPPORTED_LANGUAGES.get(lang, "English")
        return (
            f"{SYSTEM_PROMPT}\n\n"
            f"Write your entire response in {language_name}. "
            "Use language that a rural farmer can understand. "
            "When relevant, mention specific symptoms, likely cause, and clear next steps."
        )

    @staticmethod
    def _clean_response(text: str) -> str:
        """Strip chain-of-thought <think> tags produced by some models."""
        cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
        return cleaned or "No response generated."


# Module-level singleton
llm_router = LLMRouter()
