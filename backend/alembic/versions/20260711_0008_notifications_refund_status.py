"""notifications and refund status"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260711_0008"
down_revision: Union[str, None] = "20260711_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("bookings", sa.Column("refund_status", sa.String(length=20), nullable=True))
    op.add_column("bookings", sa.Column("refund_admin_note", sa.Text(), nullable=True))
    op.add_column("bookings", sa.Column("refund_resolved_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("link", sa.String(length=500), nullable=True),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_column("bookings", "refund_resolved_at")
    op.drop_column("bookings", "refund_admin_note")
    op.drop_column("bookings", "refund_status")
