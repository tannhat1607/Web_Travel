from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: list[str] = []


class ChatSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    session_id: str
    created_at: datetime
    user_name: str | None = None
    user_email: str | None = None

    @model_validator(mode="before")
    @classmethod
    def include_user_info(cls, value):
        if isinstance(value, dict):
            return value
        user = getattr(value, "user", None)
        return {
            "id": value.id,
            "user_id": value.user_id,
            "session_id": value.session_id,
            "created_at": value.created_at,
            "user_name": user.full_name if user else None,
            "user_email": user.email if user else None,
        }


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chat_session_id: int
    user_message: str
    bot_response: str
    retrieved_context: str | None
    created_at: datetime
