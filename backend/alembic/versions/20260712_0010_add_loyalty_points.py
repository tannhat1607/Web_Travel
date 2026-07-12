"""add loyalty points

Revision ID: 20260712_0010
Revises: 20260711_0009
Create Date: 2026-07-12 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260712_0010"
down_revision: Union[str, None] = "20260711_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("loyalty_points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("lifetime_points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("bookings", sa.Column("points_earned", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("bookings", sa.Column("points_awarded_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "loyalty_transactions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("booking_id", sa.Integer(), sa.ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("transaction_type", sa.String(length=30), nullable=False, index=True),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("tier_after", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("loyalty_transactions")
    op.drop_column("bookings", "points_awarded_at")
    op.drop_column("bookings", "points_earned")
    op.drop_column("users", "lifetime_points")
    op.drop_column("users", "loyalty_points")
