# Travel Booking API Backend

Database layer for the FastAPI backend using SQLAlchemy and Alembic.

## Setup

```powershell
cd D:\Travel\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/travel_db
SECRET_KEY=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Create the PostgreSQL database first:

```sql
CREATE DATABASE travel_db;
```

## Run Migrations

```powershell
alembic upgrade head
```

## Create A New Migration

After changing SQLAlchemy models:

```powershell
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Run API

```powershell
uvicorn app.main:app --reload
```

Health check:

```text
GET http://127.0.0.1:8000/health
```

## RAG Chatbot

The chatbot reads source text from `knowledge_documents`, ingests it into a local
vector store, then uses retrieved context in `POST /api/chat`.

Seed sample knowledge:

```powershell
cd D:\Travel
$env:PYTHONPATH='D:\Travel\backend'
backend\.venv\Scripts\python.exe backend\scripts\seed_knowledge.py
backend\.venv\Scripts\python.exe backend\scripts\ingest_knowledge.py
```

Default mode uses the lightweight local store:

```env
RAG_VECTOR_BACKEND=simple
```

Optional ChromaDB mode:

```powershell
cd D:\Travel\backend
.\.venv\Scripts\pip.exe install -r requirements-rag.txt
```

Then set Gemini and LangChain Chroma mode:

```env
RAG_VECTOR_BACKEND=langchain_chroma
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
```
