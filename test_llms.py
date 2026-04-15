import asyncio
import sys
import os

from backend.llm_router import llm_router

import sys
sys.stdout.reconfigure(encoding='utf-8')

async def test_languages():
    prompts = {
        "English": "Explain what crop rotation is in one short sentence.",
        "Hindi": "फसल चक्र (crop rotation) क्या है? एक छोटे वाक्य में समझाएं।",
        "Marathi": "पीक फेरपालट (crop rotation) म्हणजे काय? एका लहान वाक्यात स्पष्ट करा."
    }

    for lang, prompt in prompts.items():
        print(f"\n{'='*50}\nLanguage: {lang}\nPrompt: {prompt}\n{'='*50}")
        responses = await llm_router.get_multi_response(prompt)
        for resp in responses:
            print(f"\n[{resp.model}]:\n{resp.text}\n")
            print("-" * 30)

if __name__ == "__main__":
    asyncio.run(test_languages())
