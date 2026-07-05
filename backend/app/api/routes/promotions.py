from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.promotion import Promotion
from app.models.tour import Tour
from app.schemas.promotion import PromotionRead
from app.services.promotion_service import is_promotion_active

router = APIRouter(prefix="/promotions", tags=["promotions"])


@router.get("", response_model=list[PromotionRead])
def list_public_promotions(
    tour_id: int | None = None,
    limit: int = Query(default=12, le=50),
    db: Session = Depends(get_db),
) -> list[Promotion]:
    query = db.query(Promotion).filter(
        Promotion.is_active.is_(True),
        Promotion.auto_apply.is_(False),
        Promotion.code.isnot(None),
    )
    if tour_id is not None:
        query = query.join(Promotion.tours).filter(Tour.id == tour_id)
    promotions = query.order_by(Promotion.created_at.desc()).limit(limit).all()
    return [promotion for promotion in promotions if is_promotion_active(promotion)]
