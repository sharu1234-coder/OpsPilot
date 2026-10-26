"""Add authenticated requester ownership to tickets.

Existing tickets retain NULL requester_user_id until ownership
is explicitly verified. No legacy requester data is modified.
"""

from alembic import op
import sqlalchemy as sa

revision = "d3a9f8c21e60"
down_revision = "ccfe41aefea2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tickets",
        sa.Column(
            "requester_user_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_tickets_requester_user_id_users",
        "tickets",
        "users",
        ["requester_user_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.create_index(
        "ix_tickets_requester_user_id",
        "tickets",
        ["requester_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_tickets_requester_user_id",
        table_name="tickets",
    )

    op.drop_constraint(
        "fk_tickets_requester_user_id_users",
        "tickets",
        type_="foreignkey",
    )

    op.drop_column(
        "tickets",
        "requester_user_id",
    )
