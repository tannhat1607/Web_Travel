from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.database import get_db
from app.models.content import ContentItem
from app.models.user import User
from app.schemas.content import ContentCreate, ContentRead, ContentUpdate


router = APIRouter(prefix="/content", tags=["content"])


def apply_content_filters(query, content_type: str | None = None, q: str | None = None):
    if content_type:
        query = query.filter(ContentItem.content_type == content_type)
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                ContentItem.title.ilike(keyword),
                ContentItem.slug.ilike(keyword),
                ContentItem.excerpt.ilike(keyword),
            )
        )
    return query


@router.get("", response_model=list[ContentRead])
def public_content(
    content_type: str | None = None,
    q: str | None = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
) -> list[ContentItem]:
    query = db.query(ContentItem).filter(ContentItem.is_published.is_(True))
    query = apply_content_filters(query, content_type, q)
    return query.order_by(ContentItem.sort_order, ContentItem.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/admin", response_model=list[ContentRead])
def admin_content(
    content_type: str | None = None,
    q: str | None = None,
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ContentItem]:
    query = apply_content_filters(db.query(ContentItem), content_type, q)
    return query.order_by(ContentItem.content_type, ContentItem.sort_order, ContentItem.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/admin", response_model=ContentRead, status_code=status.HTTP_201_CREATED)
def create_content(
    payload: ContentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentItem:
    if db.query(ContentItem).filter(ContentItem.slug == payload.slug).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    item = ContentItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/admin/{item_id}", response_model=ContentRead)
def update_content(
    item_id: int,
    payload: ContentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentItem:
    item = db.get(ContentItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    data = payload.model_dump(exclude_unset=True)
    if "slug" in data:
        existing = db.query(ContentItem).filter(ContentItem.slug == data["slug"], ContentItem.id != item_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    for field, value in data.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/admin/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    item = db.get(ContentItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    db.delete(item)
    db.commit()


@router.get("/{slug}", response_model=ContentRead)
def public_content_detail(slug: str, db: Session = Depends(get_db)) -> ContentItem:
    item = (
        db.query(ContentItem)
        .filter(ContentItem.slug == slug, ContentItem.is_published.is_(True))
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return item
