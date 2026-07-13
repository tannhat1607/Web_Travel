from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.notification import Notification
from app.models.tour import Tour, TourDeparture
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingQuoteCreate, BookingQuoteRead, BookingRead, RefundRequestCreate
from app.schemas.payment import PaymentRead, PaymentSimulationCreate
from app.services.booking_service import restore_booking_slots
from app.services.departure_service import is_upcoming_departure
from app.services.loyalty_service import calculate_loyalty_discount
from app.services.promotion_service import get_code_promotion, normalize_promotion_code, quote_booking_total

router = APIRouter(prefix="/bookings", tags=["bookings"])


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


def get_bookable_departure(db: Session, tour: Tour, departure_id: int | None) -> TourDeparture | None:
    if departure_id is None:
        return None
    departure = db.get(TourDeparture, departure_id)
    if (
        departure is None
        or departure.tour_id != tour.id
        or not departure.is_active
        or not is_upcoming_departure(departure.departure_at)
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Departure is not available")
    return departure


@router.post("/quote", response_model=BookingQuoteRead)
def quote_booking(
    payload: BookingQuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingQuoteRead:
    tour = get_bookable_tour(db, payload.tour_id)
    total_people = validate_passenger_count(payload.adult_count, payload.child_count)
    departure = get_bookable_departure(db, tour, payload.departure_id)
    if departure and departure.available_slots < total_people:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough available slots")
    code_promotion = None
    normalized_code = normalize_promotion_code(payload.promotion_code)
    if normalized_code:
        code_promotion = get_code_promotion(db, tour, normalized_code)
        if code_promotion is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promotion code is not valid")
    quote = quote_booking_total(tour, payload.adult_count, payload.child_count, code_promotion)
    loyalty = calculate_loyalty_discount(quote["total"], current_user.lifetime_points)
    total = max(quote["total"] - loyalty["discount"], 0)
    quote["total"] = total
    return BookingQuoteRead(
        **quote,
        loyalty_tier_key=loyalty["tier_key"],
        loyalty_tier_label=loyalty["tier_label"],
        loyalty_discount_rate=loyalty["discount_rate"],
        loyalty_discount=loyalty["discount"],
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
    departure = get_bookable_departure(db, tour, payload.departure_id)
    inventory = departure or tour
    if inventory.available_slots < total_people:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough available slots")

    normalized_code = normalize_promotion_code(payload.promotion_code)
    code_promotion = None
    if normalized_code:
        code_promotion = get_code_promotion(db, tour, normalized_code)
        if code_promotion is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Promotion code is not valid")
    quote = quote_booking_total(tour, payload.adult_count, payload.child_count, code_promotion)
    loyalty = calculate_loyalty_discount(quote["total"], current_user.lifetime_points)
    total = max(quote["total"] - loyalty["discount"], 0)
    booking = Booking(
        user_id=current_user.id,
        tour_id=tour.id,
        departure_id=departure.id if departure else None,
        promotion_id=code_promotion.id if code_promotion else None,
        promotion_code=code_promotion.code if code_promotion else None,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        adult_count=payload.adult_count,
        child_count=payload.child_count,
        total_price=total,
        loyalty_tier_key=loyalty["tier_key"],
        loyalty_tier_label=loyalty["tier_label"],
        loyalty_discount_rate=loyalty["discount_rate"],
        loyalty_discount=loyalty["discount"],
        note=payload.note,
        status=BookingStatus.pending,
    )
    inventory.available_slots -= total_people
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


@router.post("/{booking_id}/simulate-payment", response_model=PaymentRead)
def simulate_payment(
    booking_id: int,
    payload: PaymentSimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Payment:
    booking = db.get(Booking, booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancelled booking cannot be paid")
    payment = booking.payment
    if payment and payment.status in {PaymentStatus.paid, PaymentStatus.refunded}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment is already finalized")
    if payment is None:
        payment = Payment(booking_id=booking.id, method=payload.method, amount=booking.total_price)
        db.add(payment)
    payment.method = payload.method
    payment.status = PaymentStatus.paid if payload.succeed else PaymentStatus.failed
    payment.transaction_code = f"SIM-{booking.id}-{int(datetime.now(timezone.utc).timestamp())}"
    payment.paid_at = datetime.now(timezone.utc) if payload.succeed else None
    if payload.succeed and booking.status == BookingStatus.pending:
        booking.status = BookingStatus.confirmed
    db.add(Notification(user_id=booking.user_id, title="Thanh toán thành công" if payload.succeed else "Thanh toán thất bại", message=f"Giao dịch booking #{booking.id} đã được xử lý.", link=f"/my-bookings/{booking.id}"))
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{booking_id}/refund-request", response_model=BookingRead)
def request_refund(
    booking_id: int,
    payload: RefundRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = db.get(Booking, booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status == BookingStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed booking cannot be refunded")
    if not booking.payment or booking.payment.status != PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only paid booking can request a refund")
    reason = payload.reason.strip()
    if len(reason) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refund reason is too short")
    booking.refund_requested = True
    booking.refund_reason = reason
    booking.refund_requested_at = datetime.now(timezone.utc)
    booking.refund_status = "pending"
    booking.refund_admin_note = None
    db.add(Notification(user_id=booking.user_id, title="Đã nhận yêu cầu hoàn tiền", message=f"Yêu cầu cho booking #{booking.id} đang chờ ADMIN xử lý.", link=f"/my-bookings/{booking.id}"))
    db.commit()
    db.refresh(booking)
    return booking


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
