from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.database import get_db
from app.models.contact import Contact
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactRead, ContactReply

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db)) -> Contact:
    contact = Contact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("", response_model=list[ContactRead])
def list_contacts(
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Contact]:
    return db.query(Contact).order_by(Contact.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/{contact_id}/reply", response_model=ContactRead)
def reply_contact(
    contact_id: int,
    payload: ContactReply,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Contact not found")
    contact.reply = payload.reply
    contact.is_replied = True
    contact.replied_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(contact)
    return contact
