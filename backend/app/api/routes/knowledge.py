from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.database import get_db
from app.models.knowledge import KnowledgeDocument
from app.models.user import User
from app.schemas.knowledge import KnowledgeDocumentRead
from app.services.rag_service import ingest_knowledge_documents

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


def _is_pdf_file(filename: str, content_type: str) -> bool:
    return content_type in PDF_CONTENT_TYPES or filename.lower().endswith(".pdf")


def _extract_pdf_text(raw_content: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing PDF parser dependency. Install pypdf, then restart the API.",
        ) from exc

    try:
        reader = PdfReader(BytesIO(raw_content))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid PDF file") from exc

    pages: list[str] = []
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append(f"[Trang {index}]\n{text.strip()}")
    return "\n\n".join(pages)


def _extract_upload_content(raw_content: bytes, filename: str, content_type: str) -> tuple[str, str]:
    if _is_pdf_file(filename, content_type):
        content = _extract_pdf_text(raw_content)
        if not content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF does not contain extractable text. Use a text-based PDF or OCR it first.",
            )
        return content, "pdf"

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Only PDF knowledge files are supported",
    )


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


@router.post("/upload", response_model=KnowledgeDocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_knowledge_file(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    source_type: str = Form(default="upload"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> KnowledgeDocument:
    content_type = file.content_type or "application/octet-stream"
    filename = file.filename or "uploaded-knowledge.txt"
    raw_content = await file.read()
    content, extracted_from = _extract_upload_content(raw_content, filename, content_type)

    document = KnowledgeDocument(
        title=title or filename,
        source_type=source_type,
        content=content,
        document_metadata={
            "filename": filename,
            "content_type": content_type,
            "size": len(raw_content),
            "extracted_from": extracted_from,
        },
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    ingest_knowledge_documents(db)
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
    ingest_knowledge_documents(db)
