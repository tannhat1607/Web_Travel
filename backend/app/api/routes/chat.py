from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_current_user
from app.db.database import get_db
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import ChatMessageRead, ChatRequest, ChatResponse
from app.services.rag_service import answer_question, format_contexts

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> ChatResponse:
    session_id = payload.session_id or str(uuid4())
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if session is None:
        session = ChatSession(session_id=session_id, user_id=current_user.id if current_user else None)
        db.add(session)
        db.flush()
    elif current_user and session.user_id is None:
        session.user_id = current_user.id

    rag_answer = answer_question(db=db, question=payload.message)
    retrieved_context = format_contexts(rag_answer.contexts)
    message = ChatMessage(
        chat_session_id=session.id,
        user_message=payload.message,
        bot_response=rag_answer.answer,
        retrieved_context=retrieved_context,
    )
    db.add(message)
    db.commit()

    return ChatResponse(
        session_id=session_id,
        answer=rag_answer.answer,
        sources=[context.title for context in rag_answer.contexts],
    )


@router.get("/messages", response_model=list[ChatMessageRead])
def list_chat_messages(
    session_id: str,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChatMessage]:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.session_id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if session is None:
        return []
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
