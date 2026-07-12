from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LoyaltyTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    booking_id: int | None = None
    transaction_type: str
    points: int
    tier_after: str
    description: str | None = None
    created_at: datetime
