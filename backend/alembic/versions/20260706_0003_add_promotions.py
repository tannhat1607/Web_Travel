"""add promotions

Revision ID: 20260706_0003
Revises: 20260704_0002
Create Date: 2026-07-06 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260706_0003"
down_revision: Union[str, None] = "20260704_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


promotion_discount_type = postgresql.ENUM(
    "percent",
    "fixed_amount",
    name="promotion_discount_type",
    create_type=False,
)


def upgrade() -> None:
    promotion_discount_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "promotions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("discount_type", promotion_discount_type, nullable=False),
        sa.Column("discount_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("auto_apply", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("terms", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_promotions_id"), "promotions", ["id"], unique=False)
    op.create_index(op.f("ix_promotions_code"), "promotions", ["code"], unique=True)
    op.create_table(
        "promotion_tours",
        sa.Column("promotion_id", sa.Integer(), nullable=False),
        sa.Column("tour_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tour_id"], ["tours.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("promotion_id", "tour_id"),
    )
    op.add_column("bookings", sa.Column("promotion_id", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("promotion_code", sa.String(length=50), nullable=True))
    op.create_index(op.f("ix_bookings_promotion_id"), "bookings", ["promotion_id"], unique=False)
    op.create_foreign_key(
        "fk_bookings_promotion_id_promotions",
        "bookings",
        "promotions",
        ["promotion_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_table("promotion_tours")
    op.drop_constraint("fk_bookings_promotion_id_promotions", "bookings", type_="foreignkey")
    op.drop_index(op.f("ix_bookings_promotion_id"), table_name="bookings")
    op.drop_column("bookings", "promotion_code")
    op.drop_column("bookings", "promotion_id")
    op.drop_index(op.f("ix_promotions_id"), table_name="promotions")
    op.drop_index(op.f("ix_promotions_code"), table_name="promotions")
    op.drop_table("promotions")
    promotion_discount_type.drop(op.get_bind(), checkfirst=True)
