from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ContactCreate(BaseModel):
    full_name: str
    email: str
    phone: str | None = None
    subject: str | None = None
    message: str


class ContactReply(BaseModel):
    reply: str


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str | None
    subject: str | None
    message: str
    reply: str | None
    is_replied: bool
    created_at: datetime
    replied_at: datetime | None
