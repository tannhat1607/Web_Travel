from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.booking import BookingStatus
from app.schemas.payment import PaymentRead


class BookingCreate(BaseModel):
    tour_id: int
    departure_id: int | None = None
    customer_name: str
    customer_email: str
    customer_phone: str
    adult_count: int = 1
    child_count: int = 0
    promotion_code: str | None = None
    note: str | None = None


class BookingQuoteCreate(BaseModel):
    tour_id: int
    departure_id: int | None = None
    adult_count: int = 1
    child_count: int = 0
    promotion_code: str | None = None


class BookingQuoteRead(BaseModel):
    subtotal_before_auto: Decimal
    subtotal_after_auto: Decimal
    auto_discount: Decimal
    code_discount: Decimal
    total: Decimal
    promotion_id: int | None = None
    promotion_code: str | None = None
    promotion_title: str | None = None


class BookingUpdate(BaseModel):
    status: BookingStatus | None = None
    note: str | None = None
    refund_requested: bool | None = None
    refund_reason: str | None = None


class RefundRequestCreate(BaseModel):
    reason: str


class BookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tour_id: int
    departure_id: int | None = None
    customer_name: str
    customer_email: str
    customer_phone: str
    adult_count: int
    child_count: int
    total_price: Decimal
    promotion_id: int | None = None
    promotion_code: str | None = None
    note: str | None
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
    tour_title: str | None = None
    departure_at: datetime | None = None
    payment: PaymentRead | None = None
    refund_requested: bool = False
    refund_reason: str | None = None
    refund_requested_at: datetime | None = None
    refund_status: str | None = None
    refund_admin_note: str | None = None
    refund_resolved_at: datetime | None = None
