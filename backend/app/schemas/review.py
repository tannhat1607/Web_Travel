from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReviewCreate(BaseModel):
    tour_id: int
    booking_id: int | None = None
    rating: int
    comment: str | None = None


class ReviewEligibility(BaseModel):
    can_review: bool
    booking_id: int | None = None
    reason: str | None = None


class ReviewUpdate(BaseModel):
    rating: int | None = None
    comment: str | None = None
    is_visible: bool | None = None


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tour_id: int
    booking_id: int | None
    rating: int
    comment: str | None
    is_visible: bool
    created_at: datetime
