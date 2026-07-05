from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.tour import Tour
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewEligibility, ReviewRead

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/tour/{tour_id}", response_model=list[ReviewRead])
def list_tour_reviews(
    tour_id: int,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
) -> list[Review]:
    return (
        db.query(Review)
        .filter(Review.tour_id == tour_id, Review.is_visible.is_(True))
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/tour/{tour_id}/eligibility", response_model=ReviewEligibility)
def check_review_eligibility(
    tour_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewEligibility:
    if not db.get(Tour, tour_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")

    booking = (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.tour_id == tour_id,
            Booking.status == BookingStatus.completed,
        )
        .order_by(Booking.created_at.desc())
        .first()
    )
    if not booking:
        return ReviewEligibility(can_review=False, reason="Bạn cần hoàn thành tour trước khi đánh giá.")

    existing_review = (
        db.query(Review)
        .filter(Review.user_id == current_user.id, Review.tour_id == tour_id, Review.booking_id == booking.id)
        .first()
    )
    if existing_review:
        return ReviewEligibility(can_review=False, booking_id=booking.id, reason="Bạn đã đánh giá booking này.")

    return ReviewEligibility(can_review=True, booking_id=booking.id)


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Review:
    if not db.get(Tour, payload.tour_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")

    booking = None
    if payload.booking_id is not None:
        booking = db.get(Booking, payload.booking_id)
        if not booking or booking.user_id != current_user.id or booking.tour_id != payload.tour_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking for this review")
    else:
        booking = (
            db.query(Booking)
            .filter(
                Booking.user_id == current_user.id,
                Booking.tour_id == payload.tour_id,
                Booking.status == BookingStatus.completed,
            )
            .order_by(Booking.created_at.desc())
            .first()
        )

    if not booking or booking.status != BookingStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only completed bookings can be reviewed")

    existing_review = (
        db.query(Review)
        .filter(Review.user_id == current_user.id, Review.tour_id == payload.tour_id, Review.booking_id == booking.id)
        .first()
    )
    if existing_review:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This booking has already been reviewed")

    review = Review(
        user_id=current_user.id,
        tour_id=payload.tour_id,
        booking_id=booking.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
