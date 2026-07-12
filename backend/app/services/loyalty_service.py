from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, ROUND_FLOOR

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.loyalty import LoyaltyTransaction

POINT_VALUE_VND = Decimal("1000")
LOYALTY_DISCOUNT_RATES = {
    "bronze": Decimal("2"),
    "silver": Decimal("5"),
    "gold": Decimal("10"),
}

LOYALTY_TIERS = [
    ("gold", "Vàng", 50000),
    ("silver", "Bạc", 20000),
    ("bronze", "Đồng", 10000),
]


def calculate_booking_points(amount: Decimal) -> int:
    value = Decimal(amount or 0)
    if value <= 0:
        return 0
    return int((value / POINT_VALUE_VND).to_integral_value(rounding=ROUND_FLOOR))


def get_loyalty_tier(lifetime_points: int | None) -> dict:
    points = lifetime_points or 0
    for key, label, threshold in LOYALTY_TIERS:
        if points >= threshold:
            return {"key": key, "label": label, "threshold": threshold}
    return {"key": "member", "label": "Thành viên", "threshold": 0}


def get_next_loyalty_tier(lifetime_points: int | None) -> dict | None:
    points = lifetime_points or 0
    ascending = list(reversed(LOYALTY_TIERS))
    for key, label, threshold in ascending:
        if points < threshold:
            return {
                "key": key,
                "label": label,
                "threshold": threshold,
                "points_needed": threshold - points,
            }
    return None


def get_loyalty_discount_rate(lifetime_points: int | None) -> Decimal:
    tier = get_loyalty_tier(lifetime_points)
    return LOYALTY_DISCOUNT_RATES.get(tier["key"], Decimal("0"))


def calculate_loyalty_discount(amount: Decimal, lifetime_points: int | None) -> dict:
    tier = get_loyalty_tier(lifetime_points)
    rate = get_loyalty_discount_rate(lifetime_points)
    discount = (Decimal(amount or 0) * rate / Decimal("100")).quantize(Decimal("0.01"))
    return {
        "tier_key": tier["key"],
        "tier_label": tier["label"],
        "discount_rate": rate,
        "discount": min(max(discount, Decimal("0")), Decimal(amount or 0)),
    }


def award_booking_points(db: Session, booking: Booking) -> int:
    if booking.points_awarded_at or booking.points_earned > 0:
        return booking.points_earned

    points = calculate_booking_points(booking.total_price)
    if points <= 0:
        booking.points_awarded_at = datetime.now(timezone.utc)
        return 0

    user = booking.user
    user.loyalty_points = (user.loyalty_points or 0) + points
    user.lifetime_points = (user.lifetime_points or 0) + points
    booking.points_earned = points
    booking.points_awarded_at = datetime.now(timezone.utc)

    tier = get_loyalty_tier(user.lifetime_points)
    db.add(
        LoyaltyTransaction(
            user_id=user.id,
            booking_id=booking.id,
            transaction_type="earn_completed_booking",
            points=points,
            tier_after=tier["key"],
            description=f"Cộng {points} điểm cho booking #{booking.id} đã hoàn thành.",
        )
    )
    return points
