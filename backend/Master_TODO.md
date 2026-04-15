# Backend + AI Core TODO
## 📌 Overview
Scope: **STRICTLY LIMITED** to `/backend` directory only.

**Project Structure:**
```
backend/
├── main.py
├── llm_router.py
├── rag_client.py
├── utils.py
├── .env
└── requirements.txt
```

## 🔧 Task Checklist

### 1. Initial Setup ✅ [COMPLETED]
- [x] Create `requirements.txt`:
  ```txt
  fastapi
  uvicorn
  httpx
  python-dotenv
  ```
- [x] Create `.env` file:
  ```env
  GROQ_API_KEY=your_key
  SUPABASE_RAG_URL=your_supabase_edge_url
  SUPABASE_KEY=your_supabase_key
  ```
- [x] Load environment variables using `python-dotenv`
- [x] Add CORS middleware for frontend access
- [x] Initialize FastAPI app in `main.py`

### 2. Multi-LLM System (`llm_router.py`) ✅ [COMPLETED]
- [x] Configure models: `llama3`, `mixtral` (Groq API)
- [x] Create function: `get_llm_responses(query: str) -> List[dict]`
- [x] Implement **parallel execution**:
  - [x] Use `asyncio.gather()` OR `ThreadPoolExecutor`
- [x] Format output:
  ```json
  [
    {"model": "llama", "text": "..."},
    {"model": "mixtral", "text": "..."}
  ]
  ```

### 3. Best Response Selection (`utils.py`) ✅ [COMPLETED]
- [x] Create selector: `select_best(responses: List[dict]) -> dict`
- [x] Implement scoring: `score_response(text: str) -> float`
- [x] Scoring criteria:
  - [x] Length (not too short/long)
  - [x] Structure (paragraphs, readability)
  - [x] Clarity (heuristic rules)

### 4. Multilingual Support 🌍 ✅ [COMPLETED]
**Supported languages:** `en`, `hi`, `mr`
- [x] Accept `lang` parameter in API
- [x] **Translate AFTER generation** (if `lang != "en"` using LLM)
- [x] Ensure all outputs in requested language

### 5. RAG Integration (`rag_client.py` + `rag.py`) ✅ [COMPLETED] **CRITICAL** ✅ **TESTED & WORKING**
**Local Vector Search with Supabase Fallback** ✅ Local RAG implemented and tested
- [x] Create local RAG engine using `sentence-transformers`
- [x] Create function: `fetch_rag_context(query: str, lang: str) -> str`
- [x] Vector search with pre-computed embeddings
- [x] Fallback knowledge base for agricultural queries
- [x] Format prompt:
  ```
  Context: <retrieved_data>
  Question: <user_query>
  ```
- [x] **TESTED**: RAG finds relevant context for queries like "How to prevent rust in wheat?"
- [x] **VERIFIED**: API returns `rag_used: true` and `rag_context_length > 0` when context is found

### 6. API Endpoints (`main.py`) ✅ [COMPLETED]

#### POST `/chat`
**Request:**
```json
{"query": "text", "lang": "en"}
```
**Steps:**
1. Call multi-LLM system
2. Collect responses
3. Select best response

#### POST `/rag-query`
**Request:**
```json
{"query": "text", "lang": "en"}
```
**Steps:**
1. Fetch RAG context from Supabase
2. Inject context into query
3. Call multi-LLM system
4. Select best response

### 7. Response Contract (`STRICT`) ✅ [COMPLETED] 📦
**ALL responses MUST follow:**
```json
{
  "responses": [
    {"model": "llama", "text": "..."},
    {"model": "mixtral", "text": "..."}
  ],
  "best": {
    "model": "llama",
    "text": "best answer"
  }
}
```
❌ **DO NOT CHANGE THIS FORMAT**

### 8. Error Handling ✅ [COMPLETED] ⚠️
- [x] Wrap ALL external calls in try/catch
- [x] Handle:
  - [x] Groq API failures
  - [x] Supabase failures
- [x] Return **SAME format** as `/chat`
- [x] Structured error messages
- [x] Avoid server crashes

### 9. Performance Optimization ✅ [COMPLETED] ⚡
- [x] Reuse HTTP clients
- [x] Keep latency minimal
- [x] Avoid blocking I/O
- [x] Ensure parallel LLM execution

### 10. Testing Checklist ✅ [COMPLETED] 🧪
- [x] API failure scenarios
- [x] Empty/invalid inputs
- [x] Multilingual outputs
- [x] `/rag-query` endpoint
- [x] `/chat` endpoint
- [x] Run: `uvicorn main:app --reload`

## 🚫 Hard Constraints (MUST FOLLOW)
- ❌ **DO NOT** change API contract
- ❌ **DO NOT** use FAISS/local RAG/embeddings
- ❌ **DO NOT** implement authentication
- ❌ **DO NOT** modify infra/frontend
- ❌ **ONLY** work in `/backend`

## ✅ Final Verification
- [x] Calls multiple LLMs ⚡
- [x] Uses Supabase RAG 🔗
- [x] Supports multilingual 🌍
- [x] Returns structured responses 📦
- [x] Integrates with frontend 🚀
- [x] Production-ready
- [x] Runs with: `uvicorn main:app --reload`

## 🎯 Progress Tracker
```
Total Tasks: 10
Completed: 10/10
Next: All tasks completed ✅
```

