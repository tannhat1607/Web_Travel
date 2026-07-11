from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead

router = APIRouter(prefix="/notifications", tags=["notifications"])
@router.get("", response_model=list[NotificationRead])
def list_notifications(skip:int=0, limit:int=20, db:Session=Depends(get_db), user:User=Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id==user.id).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
@router.patch("/{notification_id}/read", response_model=NotificationRead)
def read_notification(notification_id:int, db:Session=Depends(get_db), user:User=Depends(get_current_user)):
    item=db.get(Notification,notification_id)
    if not item or item.user_id!=user.id: raise HTTPException(status_code=404,detail="Notification not found")
    item.is_read=True; db.commit(); db.refresh(item); return item
