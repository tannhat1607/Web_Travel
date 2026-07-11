import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class PromotionDiscountType(str, enum.Enum):
    percent = "percent"
    fixed_amount = "fixed_amount"


promotion_tours = Table(
    "promotion_tours",
    Base.metadata,
    Column("promotion_id", ForeignKey("promotions.id", ondelete="CASCADE"), primary_key=True),
    Column("tour_id", ForeignKey("tours.id", ondelete="CASCADE"), primary_key=True),
)


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    banner_image_url: Mapped[str | None] = mapped_column(String(1000))
    discount_type: Mapped[PromotionDiscountType] = mapped_column(
        Enum(PromotionDiscountType, name="promotion_discount_type"),
        nullable=False,
    )
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    auto_apply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    usage_limit: Mapped[int | None] = mapped_column(Integer)
    used_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    terms: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    tours = relationship("Tour", secondary=promotion_tours, back_populates="promotions")

    @property
    def tour_ids(self) -> list[int]:
        return [tour.id for tour in self.tours or []]
