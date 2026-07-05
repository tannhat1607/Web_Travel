from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.payment import PaymentStatus
from app.models.tour import Tour
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingRead

router = APIRouter(prefix="/bookings", tags=["bookings"])


def restore_booking_slots(booking: Booking) -> None:
    booking.tour.available_slots += booking.adult_count + booking.child_count


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    tour = db.get(Tour, payload.tour_id)
    if not tour or not tour.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")

    total_people = payload.adult_count + payload.child_count
    if total_people <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid passenger count")
    if tour.available_slots < total_people:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough available slots")

    total_price = tour.price * payload.adult_count + (tour.price * payload.child_count * Decimal("0.7"))
    booking = Booking(
        user_id=current_user.id,
        tour_id=tour.id,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        adult_count=payload.adult_count,
        child_count=payload.child_count,
        total_price=total_price,
        note=payload.note,
        status=BookingStatus.pending,
    )
    tour.available_slots -= total_people
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
