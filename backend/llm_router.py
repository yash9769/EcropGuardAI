"""Parallel Groq-based router for multi-model responses."""

from __future__ import annotations

import asyncio
import os
import re
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from groq import AsyncGroq

try:
    from .app_utils import SUPPORTED_LANGUAGES, get_logger, pick_best, translate_text_if_needed
    from .models.schemas import LLMResponse
except ImportError:  # pragma: no cover
    from app_utils import SUPPORTED_LANGUAGES, get_logger, pick_best, translate_text_if_needed
    from models.schemas import LLMResponse

load_dotenv(Path(__file__).with_name(".env"))

logger = get_logger("backend.llm_router")


@dataclass(frozen=True)
class ModelConfig:
    public_name: str
    model_id: str
    temperature: float = 0.3
    max_tokens: int = 700


MODEL_REGISTRY: tuple[ModelConfig, ...] = (
    ModelConfig(public_name="llama", model_id="llama-3.3-70b-versatile"),
    ModelConfig(public_name="qwen", model_id="qwen/qwen3-32b"),
)

SYSTEM_PROMPT = (
    "You are a senior agricultural assistant. Give practical, accurate, field-usable advice. "
    "Structure your response with clear sections, bullet points, and numbered lists where appropriate. "
    "Use **bold** for headings and *italics* for emphasis. Keep responses concise but comprehensive. "
    "Format advice as actionable steps with clear recommendations."
)


class LLMRouter:
    def __init__(self) -> None:
        self._client: AsyncGroq | None = None

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            api_key = (os.getenv("GROQ_API_KEY") or "").strip()
            if not api_key:
                raise ValueError("GROQ_API_KEY is not configured.")
            self._client = AsyncGroq(api_key=api_key)
        return self._client

    async def get_multi_response(
        self,
        query: str,
        lang: str = "en",
        context: str = "",
    ) -> tuple[list[LLMResponse], LLMResponse]:
        if not query.strip():
            raise ValueError("Query cannot be empty.")
        if lang not in SUPPORTED_LANGUAGES:
            raise ValueError("Unsupported language. Use en, hi, or mr.")

        prompt = self._build_prompt(query=query, context=context)
        tasks = [self._generate_model_response(config, prompt, lang) for config in MODEL_REGISTRY]
        responses = list(await asyncio.gather(*tasks))
        best = pick_best(responses)
        return responses, best

    def _build_prompt(self, query: str, context: str) -> str:
        if context.strip():
            return f"Context: {context.strip()}\n\nQuestion: {query.strip()}"
        return query.strip()

    async def _generate_model_response(
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
                        {"role": "user", "content": prompt},
                    ],
                ),
                timeout=20,
            )
            text = completion.choices[0].message.content or ""
            text = self._clean_response(text)
            text = await translate_text_if_needed(
                text=text,
                target_lang=lang,
                groq_client=self.client,
            )
            logger.info("%s returned %s chars", config.public_name, len(text))
            return LLMResponse(model=config.public_name, text=text)
        except asyncio.TimeoutError:
            logger.warning("%s timed out", config.public_name)
            return LLMResponse(model=config.public_name, text="Request timed out.")
        except Exception as exc:
            logger.error("%s failed: %s", config.public_name, exc)
            return LLMResponse(model=config.public_name, text=f"Model unavailable: {exc}")

    def _system_message(self, lang: str) -> str:
        language_name = SUPPORTED_LANGUAGES[lang]
        return (
            f"{SYSTEM_PROMPT} "
            f"Write the answer in {language_name}. "
            "Use simple language that a farmer can follow. "
            "When relevant, include symptoms, likely cause, and next steps."
        )

    def _clean_response(self, text: str) -> str:
        cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text).strip()
        return cleaned or "No response generated."


llm_router = LLMRouter()
