"""add tour departures"""
from typing import Sequence, Union
from alembic import op

revision: str = "20260711_0007"
down_revision: Union[str, None] = "20260711_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("""CREATE TABLE IF NOT EXISTS tour_departures (
      id SERIAL PRIMARY KEY, tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
      departure_at TIMESTAMPTZ NOT NULL, capacity INTEGER NOT NULL DEFAULT 20,
      available_slots INTEGER NOT NULL DEFAULT 20, is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now())""")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tour_departures_tour_id ON tour_departures(tour_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tour_departures_departure_at ON tour_departures(departure_at)")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departure_id INTEGER REFERENCES tour_departures(id) ON DELETE SET NULL")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bookings_departure_id ON bookings(departure_id)")

def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_bookings_departure_id")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS departure_id")
    op.execute("DROP TABLE IF EXISTS tour_departures")
