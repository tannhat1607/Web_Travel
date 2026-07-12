"""add promotion codes

Revision ID: 20260706_0004
Revises: 20260706_0003
Create Date: 2026-07-06 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260706_0004"
down_revision: Union[str, None] = "20260706_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("promotions", sa.Column("code", sa.String(length=50), nullable=True))
    op.add_column(
        "promotions",
        sa.Column("auto_apply", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.add_column(
        "promotions",
        sa.Column("used_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
    )
    op.create_index("ix_promotions_code", "promotions", ["code"], unique=True)

    op.add_column("bookings", sa.Column("promotion_id", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("promotion_code", sa.String(length=50), nullable=True))
    op.create_index("ix_bookings_promotion_id", "bookings", ["promotion_id"], unique=False)
    op.create_foreign_key(
        "fk_bookings_promotion_id_promotions",
        "bookings",
        "promotions",
        ["promotion_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_bookings_promotion_id_promotions", "bookings", type_="foreignkey")
    op.drop_index("ix_bookings_promotion_id", table_name="bookings")
    op.drop_column("bookings", "promotion_code")
    op.drop_column("bookings", "promotion_id")

    op.drop_index("ix_promotions_code", table_name="promotions")
    op.drop_column("promotions", "used_count")
    op.drop_column("promotions", "auto_apply")
    op.drop_column("promotions", "code")
