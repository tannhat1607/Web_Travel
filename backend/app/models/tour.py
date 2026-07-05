from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Tour(Base):
    __tablename__ = "tours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    destination: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    departure_location: Mapped[str | None] = mapped_column(String(150))
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_nights: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), index=True, nullable=False)
    max_people: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    available_slots: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    image_url: Mapped[str | None] = mapped_column(Text)
    short_description: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    schedule: Mapped[str | None] = mapped_column(Text)
    food: Mapped[str | None] = mapped_column(Text)
    suitable_for: Mapped[str | None] = mapped_column(Text)
    highlights: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    bookings = relationship("Booking", back_populates="tour", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="tour", cascade="all, delete-orphan")
    images = relationship("TourImage", back_populates="tour", cascade="all, delete-orphan", order_by="TourImage.sort_order")
    itineraries = relationship("TourItinerary", back_populates="tour", cascade="all, delete-orphan", order_by="TourItinerary.day_number")


class TourImage(Base):
    __tablename__ = "tour_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id", ondelete="CASCADE"), index=True, nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_cover: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tour = relationship("Tour", back_populates="images")


class TourItinerary(Base):
    __tablename__ = "tour_itineraries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id", ondelete="CASCADE"), index=True, nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    meals: Mapped[str | None] = mapped_column(String(255))
    accommodation: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tour = relationship("Tour", back_populates="itineraries")
