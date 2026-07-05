from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.payment import PaymentStatus
from app.models.tour import Tour
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingQuoteCreate, BookingQuoteRead, BookingRead
from app.services.promotion_service import get_code_promotion, normalize_promotion_code, quote_booking_total

router = APIRouter(prefix="/bookings", tags=["bookings"])


def restore_booking_slots(booking: Booking) -> None:
    booking.tour.available_slots += booking.adult_count + booking.child_count


def get_bookable_tour(db: Session, tour_id: int) -> Tour:
    tour = db.get(Tour, tour_id)
    if not tour or not tour.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    return tour


def validate_passenger_count(adult_count: int, child_count: int) -> int:
    total_people = adult_count + child_count
    if total_people <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid passenger count")
    return total_people


@router.post("/quote", response_model=BookingQuoteRead)
def quote_booking(
    payload: BookingQuoteCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> BookingQuoteRead:
    tour = get_bookable_tour(db, payload.tour_id)
    validate_passenger_count(payload.adult_count, payload.child_count)
    code_promotion = None
    normalized_code = normalize_promotion_code(payload.promotion_code)
    if normalized_code:
        code_promotion = get_code_promotion(db, tour, normalized_code)
        if code_promotion is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promotion code is not valid")
    quote = quote_booking_total(tour, payload.adult_count, payload.child_count, code_promotion)
    return BookingQuoteRead(
        **quote,
        promotion_id=code_promotion.id if code_promotion else None,
        promotion_code=code_promotion.code if code_promotion else None,
        promotion_title=code_promotion.title if code_promotion else None,
    )


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    tour = get_bookable_tour(db, payload.tour_id)
    total_people = validate_passenger_count(payload.adult_count, payload.child_count)
    if tour.available_slots < total_people:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough available slots")

    normalized_code = normalize_promotion_code(payload.promotion_code)
    code_promotion = None
    if normalized_code:
        code_promotion = get_code_promotion(db, tour, normalized_code)
        if code_promotion is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promotion code is not valid")
    quote = quote_booking_total(tour, payload.adult_count, payload.child_count, code_promotion)
    booking = Booking(
        user_id=current_user.id,
        tour_id=tour.id,
        promotion_id=code_promotion.id if code_promotion else None,
        promotion_code=code_promotion.code if code_promotion else None,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        adult_count=payload.adult_count,
        child_count=payload.child_count,
        total_price=quote["total"],
        note=payload.note,
        status=BookingStatus.pending,
    )
    tour.available_slots -= total_people
    if code_promotion:
        code_promotion.used_count += 1
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/me", response_model=list[BookingRead])
def list_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Booking]:
    return (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get("/{booking_id}", response_model=BookingRead)
def get_my_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = db.get(Booking, booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


@router.patch("/{booking_id}/cancel", response_model=BookingRead)
def cancel_my_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = db.get(Booking, booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status == BookingStatus.cancelled:
        return booking
    if booking.status == BookingStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed booking cannot be cancelled")
    if booking.payment and booking.payment.status == PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paid booking cannot be cancelled")

    restore_booking_slots(booking)
    booking.status = BookingStatus.cancelled
    db.commit()
    db.refresh(booking)
    return booking
