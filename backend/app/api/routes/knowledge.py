from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.database import get_db
from app.models.knowledge import KnowledgeDocument
from app.models.user import User
from app.schemas.knowledge import KnowledgeDocumentCreate, KnowledgeDocumentRead, KnowledgeDocumentUpdate
from app.services.rag_service import ingest_knowledge_documents

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("", response_model=list[KnowledgeDocumentRead])
def list_knowledge_documents(
    source_type: str | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[KnowledgeDocument]:
    query = db.query(KnowledgeDocument)
    if source_type:
        query = query.filter(KnowledgeDocument.source_type == source_type)
    return query.order_by(KnowledgeDocument.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=KnowledgeDocumentRead, status_code=status.HTTP_201_CREATED)
def create_knowledge_document(
    payload: KnowledgeDocumentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> KnowledgeDocument:
    data = payload.model_dump()
    data["document_metadata"] = data.pop("metadata")
    document = KnowledgeDocument(**data)
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.post("/ingest")
def ingest_knowledge(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict[str, int | str]:
    chunk_count = ingest_knowledge_documents(db)
    return {"status": "ok", "chunks": chunk_count}


@router.patch("/{document_id}", response_model=KnowledgeDocumentRead)
def update_knowledge_document(
    document_id: int,
    payload: KnowledgeDocumentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> KnowledgeDocument:
    document = db.get(KnowledgeDocument, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge document not found")

    data = payload.model_dump(exclude_unset=True)
    if "metadata" in data:
        data["document_metadata"] = data.pop("metadata")
    for field, value in data.items():
        setattr(document, field, value)
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    document = db.get(KnowledgeDocument, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge document not found")
    db.delete(document)
    db.commit()
