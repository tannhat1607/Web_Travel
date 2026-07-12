"""add booking refund requests"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260711_0006"
down_revision: Union[str, None] = "20260711_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("refund_requested", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column("bookings", sa.Column("refund_reason", sa.Text(), nullable=True))
    op.add_column("bookings", sa.Column("refund_requested_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("bookings", "refund_requested_at")
    op.drop_column("bookings", "refund_reason")
    op.drop_column("bookings", "refund_requested")
