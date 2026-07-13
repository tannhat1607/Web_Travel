from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.promotion import TourPromotionRead


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


class TourImageBase(BaseModel):
    image_url: str
    alt_text: str | None = None
    sort_order: int = 0
    is_cover: bool = False


class TourImageCreate(TourImageBase):
    pass


class TourImageUpdate(BaseModel):
    image_url: str | None = None
    alt_text: str | None = None
    sort_order: int | None = None
    is_cover: bool | None = None


class TourImageRead(TourImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tour_id: int
    created_at: datetime


class TourItineraryBase(BaseModel):
    day_number: int
    title: str
    description: str
    meals: str | None = None
    accommodation: str | None = None


class TourItineraryCreate(TourItineraryBase):
    pass


class TourItineraryUpdate(BaseModel):
    day_number: int | None = None
    title: str | None = None
    description: str | None = None
    meals: str | None = None
    accommodation: str | None = None


class TourItineraryRead(TourItineraryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tour_id: int
    created_at: datetime


class TourDepartureBase(BaseModel):
    departure_at: datetime
    capacity: int = 20
    available_slots: int = 20
    is_active: bool = True


class TourDepartureCreate(TourDepartureBase):
    pass


class TourDepartureUpdate(BaseModel):
    departure_at: datetime | None = None
    capacity: int | None = None
    available_slots: int | None = None
    is_active: bool | None = None


class TourDepartureRead(TourDepartureBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tour_id: int
    created_at: datetime


class TourRead(TourBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    effective_price: Decimal | None = None
    active_promotion: TourPromotionRead | None = None
    average_rating: float = 5.0
    review_count: int = 0
    images: list[TourImageRead] = []
    itineraries: list[TourItineraryRead] = []
    departures: list[TourDepartureRead] = []
