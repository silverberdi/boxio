"""Alembic wrapper for the D6 SQL migration; PostgreSQL is the only durable backend."""
from pathlib import Path
from alembic import op

revision = "001_private_rooms"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute((Path(__file__).with_suffix('.sql')).read_text())

def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS private_room_capacity_trigger ON private_room_participants;")
    op.execute("DROP FUNCTION IF EXISTS enforce_private_room_capacity();")
    op.execute("DROP TABLE IF EXISTS private_room_commands;")
    op.execute("DROP TABLE IF EXISTS private_room_participants;")
    op.execute("DROP TABLE IF EXISTS private_rooms;")
