"""notifications and refund status"""
from typing import Sequence, Union
from alembic import op
revision="20260711_0008"; down_revision="20260711_0007"; branch_labels=None; depends_on=None
def upgrade():
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20)")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_admin_note TEXT")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_resolved_at TIMESTAMPTZ")
    op.execute("""CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title VARCHAR(200) NOT NULL,message TEXT NOT NULL,link VARCHAR(500),is_read BOOLEAN NOT NULL DEFAULT false,created_at TIMESTAMPTZ NOT NULL DEFAULT now())""")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id)")
def downgrade():
    op.execute("DROP TABLE IF EXISTS notifications"); op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS refund_resolved_at"); op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS refund_admin_note"); op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS refund_status")
