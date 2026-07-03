from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class TourBase(BaseModel):
    title: str
    slug: str
    destination: str
    departure_location: str | None = None
    duration_days: int
    duration_nights: int = 0
    price: Decimal
    max_people: int = 20
    available_slots: int = 20
    image_url: str | None = None
    short_description: str | None = None
    description: str | None = None
    schedule: str | None = None
    food: str | None = None
    suitable_for: str | None = None
    highlights: str | None = None
    is_active: bool = True


class TourCreate(TourBase):
    pass


class TourUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    destination: str | None = None
    departure_location: str | None = None
    duration_days: int | None = None
    duration_nights: int | None = None
    price: Decimal | None = None
    max_people: int | None = None
    available_slots: int | None = None
    image_url: str | None = None
    short_description: str | None = None
    description: str | None = None
    schedule: str | None = None
    food: str | None = None
    suitable_for: str | None = None
    highlights: str | None = None
    is_active: bool | None = None


class TourRead(TourBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
