"""add booking refund requests"""

from typing import Sequence, Union
from alembic import op

revision: str = "20260711_0006"
down_revision: Union[str, None] = "20260711_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_requested BOOLEAN NOT NULL DEFAULT false")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reason TEXT")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ")


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS refund_requested_at")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS refund_reason")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS refund_requested")
