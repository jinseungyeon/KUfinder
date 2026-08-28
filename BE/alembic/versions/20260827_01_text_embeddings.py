"""add text embeddings

Revision ID: 20260827_01
Revises: 20260826_01
Create Date: 2026-08-27
"""

import sqlalchemy as sa

from alembic import op

revision = "20260827_01"
down_revision = "20260826_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "text_embeddings",
        sa.Column("text_hash", sa.String(64), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("model_name", sa.String(120), nullable=False),
        sa.Column("embedding_dim", sa.Integer(), nullable=False),
        sa.Column("embedding", sa.ARRAY(sa.Float()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("text_hash"),
    )


def downgrade() -> None:
    op.drop_table("text_embeddings")
