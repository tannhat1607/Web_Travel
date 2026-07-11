"""add content cms"""
from alembic import op
revision="20260711_0009";down_revision="20260711_0008";branch_labels=None;depends_on=None
def upgrade():
 op.execute("""CREATE TABLE IF NOT EXISTS content_items(id SERIAL PRIMARY KEY,content_type VARCHAR(30) NOT NULL,slug VARCHAR(200) NOT NULL UNIQUE,title VARCHAR(255) NOT NULL,excerpt TEXT,content TEXT,image_url TEXT,is_published BOOLEAN NOT NULL DEFAULT true,sort_order INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT now())""");op.execute("CREATE INDEX IF NOT EXISTS ix_content_items_content_type ON content_items(content_type)")
def downgrade():op.execute("DROP TABLE IF EXISTS content_items")
