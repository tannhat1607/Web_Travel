from decimal import ROUND_HALF_UP, Decimal
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.review import Review
from app.models.tour import Tour
from app.schemas.tour import TourRead
from app.services.departure_service import is_upcoming_departure

router = APIRouter(prefix="/tours", tags=["tours"])


def normalize_search_text(value: str | None) -> str:
    if not value:
        return ""
    decomposed = unicodedata.normalize("NFD", value.casefold().replace("đ", "d"))
    without_accents = "".join(character for character in decomposed if not unicodedata.combining(character))
    return " ".join(without_accents.split())


def tour_matches(tour: Tour, term: str, fields: tuple[str, ...]) -> bool:
    normalized_term = normalize_search_text(term)
    if not normalized_term:
        return True
    searchable_text = normalize_search_text(" ".join(str(getattr(tour, field, "") or "") for field in fields))
    return normalized_term in searchable_text


def get_review_summaries(db: Session, tour_ids: list[int]) -> dict[int, tuple[float, int]]:
    if not tour_ids:
        return {}
    rows = (
        db.query(Review.tour_id, func.avg(Review.rating), func.count(Review.id))
        .filter(Review.tour_id.in_(tour_ids), Review.is_visible.is_(True))
        .group_by(Review.tour_id)
        .all()
    )
    return {
        tour_id: (
            float(Decimal(str(average)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)),
            int(review_count),
        )
        for tour_id, average, review_count in rows
    }


def to_public_tour(tour: Tour, review_summary: tuple[float, int] | None = None) -> TourRead:
    """Public pages only receive active departures that have not started yet."""
    result = TourRead.model_validate(tour)
    departures = [
        departure
        for departure in result.departures
        if departure.is_active and is_upcoming_departure(departure.departure_at)
    ]
    average_rating, review_count = review_summary or (5.0, 0)
    return result.model_copy(update={
        "departures": departures,
        "average_rating": average_rating,
        "review_count": review_count,
    })


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
) -> list[TourRead]:
    query = db.query(Tour).filter(Tour.is_active.is_(True))
    if min_price is not None:
        query = query.filter(Tour.price >= min_price)
    if max_price is not None:
        query = query.filter(Tour.price <= max_price)
    if duration_days is not None:
        query = query.filter(Tour.duration_days == duration_days)
    tours = query.order_by(Tour.created_at.desc()).all()
    if destination:
        tours = [tour for tour in tours if tour_matches(tour, destination, ("destination", "title"))]
    if search:
        tours = [
            tour
            for tour in tours
            if tour_matches(tour, search, ("title", "destination", "short_description", "description"))
        ]
    tours = tours[skip : skip + limit]
    review_summaries = get_review_summaries(db, [tour.id for tour in tours])
    return [to_public_tour(tour, review_summaries.get(tour.id)) for tour in tours]


@router.get("/{tour_id}", response_model=TourRead)
def get_tour(tour_id: int, db: Session = Depends(get_db)) -> TourRead:
    tour = db.get(Tour, tour_id)
    if not tour or not tour.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    review_summary = get_review_summaries(db, [tour.id]).get(tour.id)
    return to_public_tour(tour, review_summary)
