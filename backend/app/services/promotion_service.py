from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.promotion import Promotion
from app.models.tour import Tour


def normalize_promotion_code(code: str | None) -> str | None:
    if not code:
        return None
    normalized = code.strip().upper()
    return normalized or None


def is_promotion_active(promotion: Promotion, now: datetime | None = None) -> bool:
    if not promotion.is_active:
        return False
    if promotion.usage_limit is not None and promotion.used_count >= promotion.usage_limit:
        return False
    current_time = now or datetime.now(timezone.utc)
    start_at = _as_aware_datetime(promotion.start_at)
    end_at = _as_aware_datetime(promotion.end_at)
    if start_at and start_at > current_time:
        return False
    if end_at and end_at < current_time:
        return False
    return True


def calculate_tour_unit_price(price: Decimal, promotion: Promotion | None) -> Decimal:
    if promotion is None:
        return Decimal(price)
    return max(Decimal(price) - calculate_discount(Decimal(price), promotion), Decimal("0"))


def calculate_discount(amount: Decimal, promotion: Promotion) -> Decimal:
    discount_type = getattr(promotion.discount_type, "value", promotion.discount_type)
    discount_value = Decimal(promotion.discount_value)
    if discount_type == "percent":
        discount = Decimal(amount) * discount_value / Decimal("100")
    else:
        discount = discount_value
    return min(max(discount, Decimal("0")), Decimal(amount))


def get_best_auto_promotion(tour: Tour) -> Promotion | None:
    valid_promotions = [
        promotion
        for promotion in tour.promotions or []
        if promotion.auto_apply and not promotion.code and is_promotion_active(promotion)
    ]
    if not valid_promotions:
        return None
    return min(valid_promotions, key=lambda item: calculate_tour_unit_price(tour.price, item))


def get_code_promotion(db: Session, tour: Tour, code: str | None) -> Promotion | None:
    normalized_code = normalize_promotion_code(code)
    if not normalized_code:
        return None
    promotion = db.query(Promotion).filter(Promotion.code == normalized_code).first()
    if promotion is None or promotion.auto_apply or not is_promotion_active(promotion):
        return None
    if tour.id not in {item.id for item in promotion.tours or []}:
        return None
    return promotion


def quote_booking_total(
    tour: Tour,
    adult_count: int,
    child_count: int,
    code_promotion: Promotion | None = None,
) -> dict[str, Decimal]:
    auto_unit_price = Decimal(tour.effective_price)
    original_unit_price = Decimal(tour.price)
    passenger_units = Decimal(adult_count) + (Decimal(child_count) * Decimal("0.7"))
    subtotal_before_auto = original_unit_price * passenger_units
    subtotal_after_auto = auto_unit_price * passenger_units
    auto_discount = subtotal_before_auto - subtotal_after_auto
    code_discount = calculate_discount(subtotal_after_auto, code_promotion) if code_promotion else Decimal("0")
    total = max(subtotal_after_auto - code_discount, Decimal("0"))
    return {
        "subtotal_before_auto": subtotal_before_auto,
        "subtotal_after_auto": subtotal_after_auto,
        "auto_discount": auto_discount,
        "code_discount": code_discount,
        "total": total,
    }


def _as_aware_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
