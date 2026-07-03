from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_users: int
    total_tours: int
    total_bookings: int
    pending_bookings: int
    completed_bookings: int
    total_revenue: Decimal
