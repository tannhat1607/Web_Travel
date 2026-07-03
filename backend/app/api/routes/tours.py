from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.tour import Tour
from app.schemas.tour import TourRead

router = APIRouter(prefix="/tours", tags=["tours"])


@router.get("", response_model=list[TourRead])
def list_tours(
    destination: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    duration_days: int | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
) -> list[Tour]:
    query = db.query(Tour).filter(Tour.is_active.is_(True))
    if destination:
        query = query.filter(Tour.destination.ilike(f"%{destination}%"))
    if min_price is not None:
        query = query.filter(Tour.price >= min_price)
    if max_price is not None:
        query = query.filter(Tour.price <= max_price)
    if duration_days is not None:
        query = query.filter(Tour.duration_days == duration_days)
    if search:
        query = query.filter(Tour.title.ilike(f"%{search}%"))
    return query.order_by(Tour.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{tour_id}", response_model=TourRead)
def get_tour(tour_id: int, db: Session = Depends(get_db)) -> Tour:
    tour = db.get(Tour, tour_id)
    if not tour or not tour.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    return tour
