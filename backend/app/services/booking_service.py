from app.models.booking import Booking


def restore_booking_slots(booking: Booking) -> None:
    """Return a booking's reserved capacity to its departure or tour."""
    inventory = booking.departure or booking.tour
    inventory.available_slots += booking.adult_count + booking.child_count
