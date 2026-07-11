import enum
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id", ondelete="CASCADE"), index=True, nullable=False)
    departure_id: Mapped[int | None] = mapped_column(ForeignKey("tour_departures.id", ondelete="SET NULL"), index=True)
    promotion_id: Mapped[int | None] = mapped_column(ForeignKey("promotions.id", ondelete="SET NULL"), index=True)
    promotion_code: Mapped[str | None] = mapped_column(String(50))
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    adult_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    child_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    refund_requested: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    refund_reason: Mapped[str | None] = mapped_column(Text)
    refund_requested_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    refund_status: Mapped[str | None] = mapped_column(String(20))
    refund_admin_note: Mapped[str | None] = mapped_column(Text)
    refund_resolved_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus, name="booking_status"), index=True, nullable=False, default=BookingStatus.pending)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="bookings")
    tour = relationship("Tour", back_populates="bookings")
    departure = relationship("TourDeparture", back_populates="bookings")
    promotion = relationship("Promotion")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="booking")

    @property
    def tour_title(self) -> str | None:
        return self.tour.title if self.tour else None

    @property
    def departure_at(self):
        return self.departure.departure_at if self.departure else None
