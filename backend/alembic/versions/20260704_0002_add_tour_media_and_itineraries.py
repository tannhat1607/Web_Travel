"""add tour media and itineraries

Revision ID: 20260704_0002
Revises: 20260630_0001
Create Date: 2026-07-04 00:02:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260704_0002"
down_revision: Union[str, None] = "20260630_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tour_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tour_id", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_cover", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tour_id"], ["tours.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tour_images_id"), "tour_images", ["id"], unique=False)
    op.create_index(op.f("ix_tour_images_tour_id"), "tour_images", ["tour_id"], unique=False)

    op.create_table(
        "tour_itineraries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tour_id", sa.Integer(), nullable=False),
        sa.Column("day_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("meals", sa.String(length=255), nullable=True),
        sa.Column("accommodation", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tour_id"], ["tours.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tour_itineraries_id"), "tour_itineraries", ["id"], unique=False)
    op.create_index(op.f("ix_tour_itineraries_tour_id"), "tour_itineraries", ["tour_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tour_itineraries_tour_id"), table_name="tour_itineraries")
    op.drop_index(op.f("ix_tour_itineraries_id"), table_name="tour_itineraries")
    op.drop_table("tour_itineraries")
    op.drop_index(op.f("ix_tour_images_tour_id"), table_name="tour_images")
    op.drop_index(op.f("ix_tour_images_id"), table_name="tour_images")
    op.drop_table("tour_images")
