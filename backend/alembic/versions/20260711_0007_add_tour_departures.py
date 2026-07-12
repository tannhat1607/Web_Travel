"""add tour departures"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260711_0007"
down_revision: Union[str, None] = "20260711_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tour_departures",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tour_id", sa.Integer(), nullable=False),
        sa.Column("departure_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer(), server_default=sa.text("20"), nullable=False),
        sa.Column("available_slots", sa.Integer(), server_default=sa.text("20"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tour_id"], ["tours.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tour_departures_tour_id", "tour_departures", ["tour_id"], unique=False)
    op.create_index("ix_tour_departures_departure_at", "tour_departures", ["departure_at"], unique=False)

    op.add_column("bookings", sa.Column("departure_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_bookings_departure_id_tour_departures",
        "bookings",
        "tour_departures",
        ["departure_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_bookings_departure_id", "bookings", ["departure_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_bookings_departure_id", table_name="bookings")
    op.drop_constraint("fk_bookings_departure_id_tour_departures", "bookings", type_="foreignkey")
    op.drop_column("bookings", "departure_id")

    op.drop_index("ix_tour_departures_departure_at", table_name="tour_departures")
    op.drop_index("ix_tour_departures_tour_id", table_name="tour_departures")
    op.drop_table("tour_departures")
