from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.tour import Tour
from app.models.user import User
from app.schemas.booking import BookingRead, BookingUpdate
from app.schemas.dashboard import DashboardStats
from app.schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate
from app.schemas.tour import TourCreate, TourRead, TourUpdate
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> DashboardStats:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_tours = db.query(func.count(Tour.id)).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    pending_bookings = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.pending).scalar() or 0
    completed_bookings = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.completed).scalar() or 0
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.paid)
        .scalar()
    )
    return DashboardStats(
        total_users=total_users,
        total_tours=total_tours,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        completed_bookings=completed_bookings,
        total_revenue=total_revenue,
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
