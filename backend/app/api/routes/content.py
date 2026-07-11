from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from app.api.deps import require_admin
from app.db.database import get_db
from app.models.content import ContentItem
from app.models.user import User
from app.schemas.content import ContentCreate,ContentRead,ContentUpdate
router=APIRouter(prefix="/content",tags=["content"])
@router.get("",response_model=list[ContentRead])
def public_content(content_type:str|None=None,skip:int=0,limit:int=50,db:Session=Depends(get_db)):
    q=db.query(ContentItem).filter(ContentItem.is_published.is_(True)); q=q.filter(ContentItem.content_type==content_type) if content_type else q
    return q.order_by(ContentItem.sort_order,ContentItem.created_at.desc()).offset(skip).limit(limit).all()
@router.get("/admin",response_model=list[ContentRead])
def admin_content(content_type:str|None=None,skip:int=0,limit:int=50,db:Session=Depends(get_db),_:User=Depends(require_admin)):
    q=db.query(ContentItem); q=q.filter(ContentItem.content_type==content_type) if content_type else q
    return q.order_by(ContentItem.content_type,ContentItem.sort_order).offset(skip).limit(limit).all()
@router.post("/admin",response_model=ContentRead,status_code=201)
def create(payload:ContentCreate,db:Session=Depends(get_db),_:User=Depends(require_admin)):
    if db.query(ContentItem).filter(ContentItem.slug==payload.slug).first(): raise HTTPException(status_code=409,detail="Slug already exists")
    item=ContentItem(**payload.model_dump());db.add(item);db.commit();db.refresh(item);return item
@router.patch("/admin/{item_id}",response_model=ContentRead)
def update(item_id:int,payload:ContentUpdate,db:Session=Depends(get_db),_:User=Depends(require_admin)):
    item=db.get(ContentItem,item_id)
    if not item: raise HTTPException(status_code=404,detail="Content not found")
    for k,v in payload.model_dump(exclude_unset=True).items():setattr(item,k,v)
    db.commit();db.refresh(item);return item
@router.delete("/admin/{item_id}",status_code=204)
def delete(item_id:int,db:Session=Depends(get_db),_:User=Depends(require_admin)):
    item=db.get(ContentItem,item_id)
    if not item: raise HTTPException(status_code=404,detail="Content not found")
    db.delete(item);db.commit()
