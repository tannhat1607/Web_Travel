from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.promotion import PromotionDiscountType


class PromotionBase(BaseModel):
    title: str
    code: str | None = None
    description: str | None = None
    banner_image_url: str | None = None
    discount_type: PromotionDiscountType
    discount_value: Decimal
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_active: bool = True
    auto_apply: bool = True
    usage_limit: int | None = None
    terms: str | None = None

    @field_validator("discount_value")
    @classmethod
    def validate_discount_value(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("Discount value must be greater than 0")
        return value


class PromotionCreate(PromotionBase):
    tour_ids: list[int] = []


class PromotionUpdate(BaseModel):
    title: str | None = None
    code: str | None = None
    description: str | None = None
    banner_image_url: str | None = None
    discount_type: PromotionDiscountType | None = None
    discount_value: Decimal | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_active: bool | None = None
    auto_apply: bool | None = None
    usage_limit: int | None = None
    terms: str | None = None
    tour_ids: list[int] | None = None

    @field_validator("discount_value")
    @classmethod
    def validate_discount_value(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and value <= 0:
            raise ValueError("Discount value must be greater than 0")
        return value


class PromotionRead(PromotionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    used_count: int = 0
    created_at: datetime
    updated_at: datetime
    tour_ids: list[int] = []


class TourPromotionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    code: str | None = None
    discount_type: PromotionDiscountType
    discount_value: Decimal
    start_at: datetime | None = None
    end_at: datetime | None = None
    terms: str | None = None
