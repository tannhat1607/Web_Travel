from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class KnowledgeDocumentCreate(BaseModel):
    title: str
    source_type: str = "tour"
    source_id: int | None = None
    content: str
    metadata: dict[str, Any] | None = None
    is_active: bool = True


class KnowledgeDocumentUpdate(BaseModel):
    title: str | None = None
    source_type: str | None = None
    source_id: int | None = None
    content: str | None = None
    metadata: dict[str, Any] | None = None
    is_active: bool | None = None


class KnowledgeDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    source_type: str
    source_id: int | None
    content: str
    document_metadata: dict[str, Any] | None
    is_active: bool
    created_at: datetime
