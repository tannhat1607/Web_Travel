from decimal import Decimal

from pydantic import BaseModel, Field

class ReportPoint(BaseModel):
    label: str
    value: Decimal

class StatusPoint(BaseModel):
    status: str
    label: str
    value: int

class TopTourPoint(BaseModel):
    label: str
    value: int


class DashboardStats(BaseModel):
    total_users: int
    total_tours: int
    total_bookings: int
    pending_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    paid_payments: int
    refunded_payments: int
    total_revenue: Decimal
    revenue_by_day: list[ReportPoint] = Field(default_factory=list)
    booking_statuses: list[StatusPoint] = Field(default_factory=list)
    top_tours: list[TopTourPoint] = Field(default_factory=list)
