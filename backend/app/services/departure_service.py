from datetime import datetime, timezone


def as_utc(value: datetime) -> datetime:
    """Normalize database datetimes before comparing active departures."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def is_upcoming_departure(departure_at: datetime, *, now: datetime | None = None) -> bool:
    current_time = as_utc(now) if now is not None else datetime.now(timezone.utc)
    return as_utc(departure_at) > current_time
