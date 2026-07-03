from app.db.database import SessionLocal
from app.services.rag_service import ingest_knowledge_documents


def main() -> None:
    db = SessionLocal()
    try:
        chunk_count = ingest_knowledge_documents(db)
        print(f"Ingested {chunk_count} chunks into the RAG vector store.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
