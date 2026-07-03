from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    booking_id: int
    method: PaymentMethod = PaymentMethod.cash
    amount: Decimal
    transaction_code: str | None = None


class PaymentUpdate(BaseModel):
    method: PaymentMethod | None = None
    status: PaymentStatus | None = None
    transaction_code: str | None = None
    paid_at: datetime | None = None


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    method: PaymentMethod
    status: PaymentStatus
    amount: Decimal
    transaction_code: str | None
    paid_at: datetime | None
    created_at: datetime
