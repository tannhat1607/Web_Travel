"""add promotion banner image"""

from typing import Sequence, Union
from alembic import op

revision: str = "20260711_0005"
down_revision: Union[str, None] = "20260706_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE promotions ADD COLUMN IF NOT EXISTS banner_image_url VARCHAR(1000)")


def downgrade() -> None:
    op.execute("ALTER TABLE promotions DROP COLUMN IF EXISTS banner_image_url")
