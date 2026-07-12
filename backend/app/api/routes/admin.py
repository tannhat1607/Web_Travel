from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.chat import ChatMessage, ChatSession
from app.models.payment import Payment, PaymentStatus
from app.models.notification import Notification
from app.models.promotion import Promotion
from app.models.review import Review
from app.models.tour import Tour, TourDeparture, TourImage, TourItinerary
from app.models.user import User
from app.schemas.booking import BookingRead, BookingUpdate
from app.schemas.chat import ChatMessageRead, ChatSessionRead
from app.schemas.dashboard import DashboardStats
from app.schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate
from app.schemas.promotion import PromotionCreate, PromotionRead, PromotionUpdate
from app.schemas.review import ReviewRead, ReviewUpdate
from app.schemas.tour import (
    TourCreate,
    TourDepartureCreate,
    TourDepartureRead,
    TourDepartureUpdate,
    TourImageCreate,
    TourImageRead,
    TourImageUpdate,
    TourItineraryCreate,
    TourItineraryRead,
    TourItineraryUpdate,
    TourRead,
    TourUpdate,
)
from app.schemas.upload import ImageUploadRead
from app.schemas.user import UserRead, UserUpdate
from app.services.promotion_service import normalize_promotion_code
from app.services.booking_service import restore_booking_slots
from app.services.loyalty_service import award_booking_points
from app.services.storage_service import upload_image_to_supabase
from app.services.rag_service import ingest_knowledge_documents
from app.services.tour_knowledge_service import delete_tour_knowledge, sync_tour_knowledge

router = APIRouter(prefix="/admin", tags=["admin"])


def sync_promotion_tour_knowledge(db: Session, tours: list[Tour]) -> None:
    unique_tours = {tour.id: tour for tour in tours if tour is not None}
    for tour in unique_tours.values():
        sync_tour_knowledge(db, tour, rebuild_index=False)
    if unique_tours:
        ingest_knowledge_documents(db)


def set_promotion_tours(db: Session, promotion: Promotion, tour_ids: list[int]) -> None:
    tours = []
    if tour_ids:
        tours = db.query(Tour).filter(Tour.id.in_(tour_ids)).all()
        found_ids = {tour.id for tour in tours}
        missing_ids = sorted(set(tour_ids) - found_ids)
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tour not found: {', '.join(str(item) for item in missing_ids)}",
            )
    promotion.tours = tours


@router.post("/uploads/images", response_model=ImageUploadRead, status_code=status.HTTP_201_CREATED)
async def upload_tour_image(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
) -> ImageUploadRead:
    return await upload_image_to_supabase(file)


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> DashboardStats:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_tours = db.query(func.count(Tour.id)).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    pending_bookings = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.pending).scalar() or 0
    completed_bookings = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.completed).scalar() or 0
    cancelled_bookings = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.cancelled).scalar() or 0
    paid_payments = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.paid).scalar() or 0
    refunded_payments = db.query(func.count(Payment.id)).filter(Payment.status == PaymentStatus.refunded).scalar() or 0
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.paid)
        .scalar()
    )
    today = date.today()
    start_day = today - timedelta(days=6)
    revenue_rows = (
        db.query(func.date(Payment.paid_at), func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.status == PaymentStatus.paid,
            Payment.paid_at.isnot(None),
            func.date(Payment.paid_at) >= start_day,
        )
        .group_by(func.date(Payment.paid_at))
        .all()
    )
    def normalize_day(value):
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        return datetime.fromisoformat(str(value)).date()

    revenue_by_date = {normalize_day(row_day): value for row_day, value in revenue_rows}
    status_labels = {
        BookingStatus.pending: "Chờ xử lý",
        BookingStatus.confirmed: "Đã xác nhận",
        BookingStatus.completed: "Hoàn thành",
        BookingStatus.cancelled: "Đã hủy",
    }
    status_rows = (
        db.query(Booking.status, func.count(Booking.id))
        .group_by(Booking.status)
        .all()
    )
    status_counts = {status_value: count for status_value, count in status_rows}
    top_rows = (
        db.query(Tour.title, func.count(Booking.id))
        .join(Booking, Booking.tour_id == Tour.id)
        .join(Payment, Payment.booking_id == Booking.id)
        .filter(Payment.status == PaymentStatus.paid)
        .group_by(Tour.id, Tour.title)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )
    return DashboardStats(
        total_users=total_users,
        total_tours=total_tours,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        completed_bookings=completed_bookings,
        cancelled_bookings=cancelled_bookings,
        paid_payments=paid_payments,
        refunded_payments=refunded_payments,
        total_revenue=total_revenue,
        revenue_by_day=[
            {"label": (start_day + timedelta(days=offset)).strftime("%d/%m"), "value": revenue_by_date.get(start_day + timedelta(days=offset), 0)}
            for offset in range(7)
        ],
        booking_statuses=[
            {"status": status_value.value, "label": label, "value": status_counts.get(status_value, 0)}
            for status_value, label in status_labels.items()
        ],
        top_tours=[{"label": title, "value": count} for title, count in top_rows],
    )


@router.get("/users", response_model=list[UserRead])
def list_users(
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/tours", response_model=list[TourRead])
def admin_list_tours(
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Tour]:
    return db.query(Tour).order_by(Tour.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/tours", response_model=TourRead, status_code=status.HTTP_201_CREATED)
def create_tour(
    payload: TourCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Tour:
    if db.query(Tour).filter(Tour.slug == payload.slug).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tour slug already exists")
    tour = Tour(**payload.model_dump())
    db.add(tour)
    db.commit()
    db.refresh(tour)
    sync_tour_knowledge(db, tour)
    return tour


@router.patch("/tours/{tour_id}", response_model=TourRead)
def update_tour(
    tour_id: int,
    payload: TourUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Tour:
    tour = db.get(Tour, tour_id)
    if tour is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")

    data = payload.model_dump(exclude_unset=True)
    if "slug" in data:
        existing = db.query(Tour).filter(Tour.slug == data["slug"], Tour.id != tour_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tour slug already exists")
    for field, value in data.items():
        setattr(tour, field, value)
    db.commit()
    db.refresh(tour)
    sync_tour_knowledge(db, tour)
    return tour


@router.delete("/tours/{tour_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour(
    tour_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    tour = db.get(Tour, tour_id)
    if tour is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    db.delete(tour)
    db.commit()
    delete_tour_knowledge(db, tour_id)


@router.get("/promotions", response_model=list[PromotionRead])
def list_promotions(
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Promotion]:
    return db.query(Promotion).order_by(Promotion.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/promotions", response_model=PromotionRead, status_code=status.HTTP_201_CREATED)
def create_promotion(
    payload: PromotionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Promotion:
    data = payload.model_dump(exclude={"tour_ids"})
    data["code"] = normalize_promotion_code(data.get("code"))
    if data["code"]:
        if db.query(Promotion).filter(Promotion.code == data["code"]).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Promotion code already exists")
        data["auto_apply"] = False
    promotion = Promotion(**data)
    set_promotion_tours(db, promotion, payload.tour_ids)
    db.add(promotion)
    db.commit()
    db.refresh(promotion)
    sync_promotion_tour_knowledge(db, list(promotion.tours))
    return promotion


@router.patch("/promotions/{promotion_id}", response_model=PromotionRead)
def update_promotion(
    promotion_id: int,
    payload: PromotionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Promotion:
    promotion = db.get(Promotion, promotion_id)
    if promotion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")

    previous_tours = list(promotion.tours)
    data = payload.model_dump(exclude_unset=True)
    tour_ids = data.pop("tour_ids", None)
    if "code" in data:
        data["code"] = normalize_promotion_code(data.get("code"))
        if data["code"]:
            existing = db.query(Promotion).filter(Promotion.code == data["code"], Promotion.id != promotion_id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Promotion code already exists")
            data["auto_apply"] = False
    for field, value in data.items():
        setattr(promotion, field, value)
    if tour_ids is not None:
        set_promotion_tours(db, promotion, tour_ids)
    db.commit()
    db.refresh(promotion)
    sync_promotion_tour_knowledge(db, previous_tours + list(promotion.tours))
    return promotion


@router.delete("/promotions/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    promotion = db.get(Promotion, promotion_id)
    if promotion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    affected_tours = list(promotion.tours)
    db.delete(promotion)
    db.commit()
    sync_promotion_tour_knowledge(db, affected_tours)


@router.post("/tours/{tour_id}/images", response_model=TourImageRead, status_code=status.HTTP_201_CREATED)
def create_tour_image(
    tour_id: int,
    payload: TourImageCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> TourImage:
    tour = db.get(Tour, tour_id)
    if tour is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    if payload.is_cover:
        db.query(TourImage).filter(TourImage.tour_id == tour_id).update({"is_cover": False})
        tour.image_url = payload.image_url
    image = TourImage(tour_id=tour_id, **payload.model_dump())
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.patch("/tour-images/{image_id}", response_model=TourImageRead)
def update_tour_image(
    image_id: int,
    payload: TourImageUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> TourImage:
    image = db.get(TourImage, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour image not found")
    data = payload.model_dump(exclude_unset=True)
    if data.get("is_cover") is True:
        db.query(TourImage).filter(TourImage.tour_id == image.tour_id, TourImage.id != image_id).update({"is_cover": False})
    for field, value in data.items():
        setattr(image, field, value)
    if image.is_cover:
        image.tour.image_url = image.image_url
    db.commit()
    db.refresh(image)
    return image


@router.delete("/tour-images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour_image(
    image_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    image = db.get(TourImage, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour image not found")
    db.delete(image)
    db.commit()


@router.post("/tours/{tour_id}/itineraries", response_model=TourItineraryRead, status_code=status.HTTP_201_CREATED)
def create_tour_itinerary(
    tour_id: int,
    payload: TourItineraryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> TourItinerary:
    if db.get(Tour, tour_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    itinerary = TourItinerary(tour_id=tour_id, **payload.model_dump())
    db.add(itinerary)
    db.commit()
    db.refresh(itinerary)
    sync_tour_knowledge(db, itinerary.tour)
    return itinerary


@router.patch("/tour-itineraries/{itinerary_id}", response_model=TourItineraryRead)
def update_tour_itinerary(
    itinerary_id: int,
    payload: TourItineraryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> TourItinerary:
    itinerary = db.get(TourItinerary, itinerary_id)
    if itinerary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour itinerary not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(itinerary, field, value)
    db.commit()
    db.refresh(itinerary)
    sync_tour_knowledge(db, itinerary.tour)
    return itinerary


@router.delete("/tour-itineraries/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour_itinerary(
    itinerary_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    itinerary = db.get(TourItinerary, itinerary_id)
    if itinerary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour itinerary not found")
    tour = itinerary.tour
    db.delete(itinerary)
    db.commit()
    sync_tour_knowledge(db, tour)


@router.post("/tours/{tour_id}/departures", response_model=TourDepartureRead, status_code=status.HTTP_201_CREATED)
def create_departure(tour_id: int, payload: TourDepartureCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> TourDeparture:
    if db.get(Tour, tour_id) is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    departure = TourDeparture(tour_id=tour_id, **payload.model_dump())
    db.add(departure); db.commit(); db.refresh(departure)
    return departure


@router.patch("/tour-departures/{departure_id}", response_model=TourDepartureRead)
def update_departure(departure_id: int, payload: TourDepartureUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> TourDeparture:
    departure = db.get(TourDeparture, departure_id)
    if departure is None: raise HTTPException(status_code=404, detail="Departure not found")
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(departure, field, value)
    db.commit(); db.refresh(departure); return departure


@router.delete("/tour-departures/{departure_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_departure(departure_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> None:
    departure = db.get(TourDeparture, departure_id)
    if departure is None: raise HTTPException(status_code=404, detail="Departure not found")
    if departure.bookings: raise HTTPException(status_code=409, detail="Departure already has bookings")
    db.delete(departure); db.commit()


@router.get("/bookings", response_model=list[BookingRead])
def admin_list_bookings(
    status_filter: BookingStatus | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Booking]:
    query = db.query(Booking)
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    return query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/bookings/{booking_id}", response_model=BookingRead)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    db.commit()
    db.refresh(booking)
    return booking


@router.patch("/bookings/{booking_id}/confirm", response_model=BookingRead)
def confirm_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancelled booking cannot be confirmed")
    if booking.status == BookingStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed booking cannot be confirmed again")
    booking.status = BookingStatus.confirmed
    db.commit()
    db.refresh(booking)
    return booking


@router.patch("/bookings/{booking_id}/cancel", response_model=BookingRead)
def admin_cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
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


@router.patch("/bookings/{booking_id}/complete", response_model=BookingRead)
def complete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cancelled booking cannot be completed")
    if not booking.payment or booking.payment.status != PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking must be paid before completion")
    booking.status = BookingStatus.completed
    earned_points = award_booking_points(db, booking)
    if earned_points > 0:
        db.add(Notification(user_id=booking.user_id, title="Đã cộng điểm thành viên", message=f"Booking #{booking.id} hoàn thành. Bạn nhận được {earned_points} điểm Travelora.", link="/profile"))
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Payment:
    booking = db.get(Booking, payload.booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.payment:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment already exists for this booking")
    payment = Payment(**payload.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.patch("/payments/{payment_id}", response_model=PaymentRead)
def update_payment(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Payment:
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    data = payload.model_dump(exclude_unset=True)
    if data.get("status") == PaymentStatus.paid and data.get("paid_at") is None:
        data["paid_at"] = datetime.now(timezone.utc)
    for field, value in data.items():
        setattr(payment, field, value)
    db.commit()
    db.refresh(payment)
    return payment


@router.patch("/payments/{payment_id}/mark-paid", response_model=PaymentRead)
def mark_payment_paid(
    payment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Payment:
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    payment.status = PaymentStatus.paid
    payment.paid_at = payment.paid_at or datetime.now(timezone.utc)
    if payment.booking.status == BookingStatus.pending:
        payment.booking.status = BookingStatus.confirmed
    db.commit()
    db.refresh(payment)
    return payment


@router.patch("/payments/{payment_id}/mark-failed", response_model=PaymentRead)
def mark_payment_failed(
    payment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Payment:
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.status == PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paid payment cannot be marked failed")
    payment.status = PaymentStatus.failed
    db.commit()
    db.refresh(payment)
    return payment


@router.patch("/payments/{payment_id}/refund", response_model=PaymentRead)
def refund_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Payment:
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.status != PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only paid payment can be refunded")
    if payment.booking.status == BookingStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed booking cannot be refunded")
    payment.status = PaymentStatus.refunded
    booking = payment.booking
    if booking.status not in {BookingStatus.cancelled, BookingStatus.completed}:
        restore_booking_slots(booking)
        booking.status = BookingStatus.cancelled
    booking.refund_requested = False
    booking.refund_status = "approved"
    booking.refund_resolved_at = datetime.now(timezone.utc)
    db.add(Notification(user_id=booking.user_id, title="Hoàn tiền đã được duyệt", message=f"Booking #{booking.id} đã được hoàn tiền và hủy.", link=f"/my-bookings/{booking.id}"))
    db.commit()
    db.refresh(payment)
    return payment


@router.patch("/bookings/{booking_id}/reject-refund", response_model=BookingRead)
def reject_refund(booking_id:int, note:str="Không đủ điều kiện hoàn tiền", db:Session=Depends(get_db), _:User=Depends(require_admin)) -> Booking:
    booking=db.get(Booking,booking_id)
    if not booking or booking.refund_status!="pending": raise HTTPException(status_code=400,detail="Refund request is not pending")
    booking.refund_requested=False; booking.refund_status="rejected"; booking.refund_admin_note=note; booking.refund_resolved_at=datetime.now(timezone.utc)
    db.add(Notification(user_id=booking.user_id,title="Yêu cầu hoàn tiền bị từ chối",message=f"Booking #{booking.id}: {note}",link=f"/my-bookings/{booking.id}"))
    db.commit(); db.refresh(booking); return booking


@router.get("/reviews", response_model=list[ReviewRead])
def admin_list_reviews(
    tour_id: int | None = None,
    is_visible: bool | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Review]:
    query = db.query(Review)
    if tour_id is not None:
        query = query.filter(Review.tour_id == tour_id)
    if is_visible is not None:
        query = query.filter(Review.is_visible == is_visible)
    return query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/reviews/{review_id}", response_model=ReviewRead)
def admin_update_review(
    review_id: int,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Review:
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    db.delete(review)
    db.commit()


@router.get("/chat-sessions", response_model=list[ChatSessionRead])
def admin_list_chat_sessions(
    user_id: int | None = None,
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ChatSession]:
    query = db.query(ChatSession)
    if user_id is not None:
        query = query.filter(ChatSession.user_id == user_id)
    return query.order_by(ChatSession.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/chat-sessions/{session_id}/messages", response_model=list[ChatMessageRead])
def admin_list_chat_messages(
    session_id: str,
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ChatMessage]:
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
