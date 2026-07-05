from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


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
