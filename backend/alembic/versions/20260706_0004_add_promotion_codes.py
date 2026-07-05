"""add promotion codes

Revision ID: 20260706_0004
Revises: 20260706_0003
Create Date: 2026-07-06 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260706_0004"
down_revision: Union[str, None] = "20260706_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE promotions ADD COLUMN IF NOT EXISTS code VARCHAR(50)")
    op.execute("ALTER TABLE promotions ADD COLUMN IF NOT EXISTS auto_apply BOOLEAN NOT NULL DEFAULT true")
    op.execute("ALTER TABLE promotions ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_promotions_code ON promotions (code)")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promotion_id INTEGER")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promotion_code VARCHAR(50)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bookings_promotion_id ON bookings (promotion_id)")
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_promotion_id_promotions'
            ) THEN
                ALTER TABLE bookings
                ADD CONSTRAINT fk_bookings_promotion_id_promotions
                FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_promotion_id_promotions")
    op.execute("DROP INDEX IF EXISTS ix_bookings_promotion_id")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS promotion_code")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS promotion_id")
    op.execute("DROP INDEX IF EXISTS ix_promotions_code")
    op.execute("ALTER TABLE promotions DROP COLUMN IF EXISTS used_count")
    op.execute("ALTER TABLE promotions DROP COLUMN IF EXISTS auto_apply")
    op.execute("ALTER TABLE promotions DROP COLUMN IF EXISTS code")
