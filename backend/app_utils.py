"""Shared backend utilities for logging, scoring, and translation."""

from __future__ import annotations

import logging
import os
import re

try:
    from .models.schemas import LLMResponse
except ImportError:  # pragma: no cover
    from models.schemas import LLMResponse

SUPPORTED_LANGUAGES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
}


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(level)

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s"))
    logger.addHandler(handler)
    logger.propagate = False
    return logger


logger = get_logger("backend.app_utils")


def _length_score(text: str) -> float:
    size = len(text.strip())
    if size < 40:
        return 0.15
    if size <= 220:
        return 0.85
    if size <= 700:
        return 1.0
    return max(0.35, 1.0 - ((size - 700) / 1800))


def _structure_score(text: str) -> float:
    score = 0.0
    if "\n" in text:
        score += 0.2
    if re.search(r"(^|\n)([-*]|\d+\.)\s", text):
        score += 0.35
    if ":" in text:
        score += 0.15
    if len(re.findall(r"[.!?]", text)) >= 2:
        score += 0.3
    return min(score, 1.0)


def _clarity_score(text: str) -> float:
    lowered = text.lower()
    if any(term in lowered for term in ("model unavailable", "timed out", "error", "failed")):
        return 0.0

    words = re.findall(r"\b\w+\b", text)
    if not words:
        return 0.0

    average_word_length = sum(len(word) for word in words) / len(words)
    sentence_count = max(1, len(re.findall(r"[.!?]", text)))
    average_sentence_length = len(words) / sentence_count

    score = 1.0
    if average_word_length > 7:
        score -= 0.2
    if average_sentence_length > 24:
        score -= 0.25
    if average_sentence_length < 4:
        score -= 0.15
    return max(0.0, min(score, 1.0))


def score_response(text: str) -> float:
    lowered = text.lower()
    if "model unavailable" in lowered or "timed out" in lowered:
        return -1.0
    return round(
        (_length_score(text) * 0.3) + (_structure_score(text) * 0.3) + (_clarity_score(text) * 0.4),
        4,
    )


def pick_best(responses: list[LLMResponse]) -> LLMResponse:
    if not responses:
        raise ValueError("No responses available for ranking.")

    ranked = sorted(
        ((response, score_response(response.text)) for response in responses),
        key=lambda item: item[1],
        reverse=True,
    )
    winner, score = ranked[0]
    logger.info(
        "Best response selected: %s (%s) | %s",
        winner.model,
        score,
        ", ".join(f"{response.model}={value}" for response, value in ranked),
    )
    return winner


async def translate_text_if_needed(
    text: str,
    target_lang: str,
    groq_client,
    model_id: str = "llama-3.1-8b-instant",
) -> str:
    if target_lang == "en":
        return text
    if target_lang not in SUPPORTED_LANGUAGES:
        return text
    if _looks_like_language(text, target_lang):
        return text

    target_name = SUPPORTED_LANGUAGES[target_lang]
    prompt = (
        f"Translate the following agriculture guidance into {target_name}. "
        "Preserve formatting and keep the meaning unchanged. "
        "Return only the translated text.\n\n"
        f"{text}"
    )
    try:
        completion = await groq_client.chat.completions.create(
            model=model_id,
            temperature=0.1,
            max_tokens=900,
            messages=[{"role": "user", "content": prompt}],
        )
        translated = completion.choices[0].message.content or text
        return translated.strip()
    except Exception as exc:
        logger.warning("Translation fallback failed: %s", exc)
        return text


def _looks_like_language(text: str, target_lang: str) -> bool:
    if target_lang in {"hi", "mr"}:
        return bool(re.search(r"[\u0900-\u097F]", text))
    return True
