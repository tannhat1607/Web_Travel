from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    tour_id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    adult_count: int = 1
    child_count: int = 0
    note: str | None = None


class BookingUpdate(BaseModel):
    status: BookingStatus | None = None
    note: str | None = None


class BookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tour_id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    adult_count: int
    child_count: int
    total_price: Decimal
    note: str | None
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
