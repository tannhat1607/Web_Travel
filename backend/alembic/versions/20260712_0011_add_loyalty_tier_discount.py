"""add loyalty tier discount to bookings

Revision ID: 20260712_0011
Revises: 20260712_0010
Create Date: 2026-07-12 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "20260712_0011"
down_revision: Union[str, None] = "20260712_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("bookings", sa.Column("loyalty_tier_key", sa.String(length=20), nullable=True))
    op.add_column("bookings", sa.Column("loyalty_tier_label", sa.String(length=30), nullable=True))
    op.add_column("bookings", sa.Column("loyalty_discount_rate", sa.Numeric(5, 2), nullable=False, server_default="0"))
    op.add_column("bookings", sa.Column("loyalty_discount", sa.Numeric(12, 2), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("bookings", "loyalty_discount")
    op.drop_column("bookings", "loyalty_discount_rate")
    op.drop_column("bookings", "loyalty_tier_label")
    op.drop_column("bookings", "loyalty_tier_key")
