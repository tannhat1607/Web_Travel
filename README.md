# Travel Booking Backend

FastAPI backend for the Travelora booking app. It handles auth, tours, bookings,
reviews, contacts, admin management, and the RAG chatbot.

## Tech Stack

- FastAPI + Uvicorn
- PostgreSQL + SQLAlchemy + Alembic
- LangChain RAG
- Chroma Cloud for vector storage
- Gemini for embeddings and chat responses
- Supabase Storage for tour images

## Project Flow

```text
Admin creates/updates/deletes a tour
-> backend syncs the tour into knowledge_documents
-> backend rebuilds the Chroma Cloud RAG index
-> chatbot can answer questions about that tour

Admin uploads a supplemental PDF
-> backend extracts PDF text
-> saves it into knowledge_documents
-> rebuilds the Chroma Cloud RAG index
-> chatbot can answer from that PDF too
```

Tour data is the main source for chatbot tour answers. PDF upload is only for
extra long-form material such as policies, FAQs, travel guides, and terms.

## Required Accounts

You need these keys before using RAG:

- Gemini API key: `GOOGLE_API_KEY`
- Chroma Cloud API key/database: `CHROMA_API_KEY`, `CHROMA_TENANT`, `CHROMA_DATABASE`

Supabase is only required if you use image upload for tours.

## Backend Setup

```powershell
cd D:\Travel\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend\.env`.

Minimum local database config:

```env
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOSTNAME=localhost
DATABASE_PORT=5432
DATABASE_NAME=travel_db
SECRET_KEY=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

RAG config:

```env
CHROMA_COLLECTION_NAME=travel_knowledge
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_chroma_tenant
CHROMA_DATABASE=your_chroma_database
RAG_TOP_K=4
RAG_MAX_DISTANCE=0.9
RAG_LEXICAL_MIN_SCORE=0.15

GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001

```

Supabase image upload config:

```env
MAX_UPLOAD_IMAGE_SIZE_MB=5
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=tour-images
SUPABASE_STORAGE_FOLDER=tours
```

## Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE travel_db;
```

Run migrations:

```powershell
cd D:\Travel\backend
.\.venv\Scripts\activate
alembic upgrade head
```

## Run Backend

```powershell
cd D:\Travel\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
GET http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## Run Frontend

```powershell
cd D:\Travel\frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://127.0.0.1:5173
```

The frontend calls the backend at:

```text
http://127.0.0.1:8000/api
```

## RAG Behavior

Important files:

- `app/api/routes/knowledge.py`: PDF upload, PDF text extraction, PDF knowledge delete.
- `app/services/rag_service.py`: split documents, embed with Gemini, store/query Chroma Cloud.
- `app/services/tour_knowledge_service.py`: converts tour data into RAG knowledge.
- `app/api/routes/chat.py`: chatbot endpoint.
- `app/api/routes/admin.py`: tour CRUD and itinerary CRUD trigger RAG sync.

Current behavior:

- Creating a tour automatically creates a `knowledge_documents` row with `source_type="tour"`.
- Updating a tour automatically updates its RAG knowledge.
- Deleting a tour deletes its generated RAG knowledge.
- Creating/updating/deleting an itinerary updates the parent tour knowledge.
- Uploading a PDF creates a `knowledge_documents` row with `source_type="upload"`.
- Chroma Cloud is rebuilt after each tour/PDF knowledge change.

## PDF Upload Rules

Only text-based PDF files are supported.

Good PDF structure:

- clear title
- tour name, price, duration, destination
- short sections
- bullet points
- FAQ section

Avoid:

- scanned image-only PDFs
- brochure screenshots
- complex multi-column layouts

If a PDF is scanned, OCR it first before uploading.

## Chroma Cloud Notes

Create a Chroma Cloud database, then fill:

```env
CHROMA_API_KEY=
CHROMA_TENANT=
CHROMA_DATABASE=
```

Optional CLI flow:

```powershell
cd D:\Travel\backend
chroma login
chroma db connect your_database_name --env-file
```

## Common Issues

Port `8000` already in use:

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 8000 }
Stop-Process -Id <PID>
```

Chatbot says connection error:

- Make sure backend is running on `127.0.0.1:8000`.
- Check `GET http://127.0.0.1:8000/health`.

PDF upload fails:

- Make sure the file is a real PDF.
- Make sure it contains extractable text.
- OCR scanned PDFs before upload.

No RAG answer for a new tour:

- Confirm the tour was created successfully.
- Confirm backend env has Chroma and Gemini keys.
- Check Chroma Cloud collection `travel_knowledge`.

## Git Safety

Do not commit:

- `backend/.env`
- `frontend/.env`
- `.venv/`
- `node_modules/`
- `dist/`
- local PDF test files

These are ignored by `.gitignore`.
