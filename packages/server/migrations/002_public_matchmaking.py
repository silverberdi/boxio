"""D7 public 1v1 queue and fixed-seat match state."""
from pathlib import Path
from alembic import op

revision = "002_public_matchmaking"
down_revision = "001_private_rooms"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute((Path(__file__).with_suffix(".sql")).read_text())

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS public_match_seats;")
    op.execute("DROP TABLE IF EXISTS public_matches;")
    op.execute("DROP TABLE IF EXISTS public_matchmaking_searches;")
