# AgriSense AI — Backend

Production-ready FastAPI backend for an AI-powered agriculture assistant.

> **Team note:** This is a backend-only service. Do **not** modify `frontend/` or `infra/`.

---

## Setup

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY
```

### 3. Run the development server
```bash
# From the project root (d:\Projects\EcropGuardAI)
uvicorn backend.main:app --reload
```

Access API docs at: **http://localhost:8000/docs**

---

## API Contract (frozen — do not change)

### `POST /chat`
```json
// Request
{ "query": "How do I treat leaf blight?" }

// Response
{
  "responses": [
    { "model": "llama",   "text": "..." },
    { "model": "mixtral", "text": "..." }
  ]
}
```

### `POST /rag-query`
Same request/response shape as `/chat`. Context is injected from the FAISS knowledge base.

### `POST /detect-disease`
- **Request:** `multipart/form-data` with field `file` (image)
- **Response:**
```json
{ "disease": "Leaf Blight", "confidence": 0.94 }
```

---

## Architecture

```
backend/
├── main.py                     # FastAPI app + routes
├── llm_router.py               # Groq multi-LLM dispatcher (llama3 + mixtral)
├── rag.py                      # FAISS + sentence-transformers RAG engine
├── models/
│   └── schemas.py              # Pydantic request/response models
├── services/
│   └── image_processing.py     # Pillow + OpenCV preprocessing + mock detection
└── utils/
    └── logger.py               # Centralised logging
```

---

## Environment Variables

| Variable      | Required | Description               |
|---------------|----------|---------------------------|
| `GROQ_API_KEY`| ✅        | Groq API key for LLM calls|
| `LOG_LEVEL`   | ❌        | Logging verbosity (default `INFO`) |
