"""initial KU-finder schema

Revision ID: 20260824_01
Revises:
Create Date: 2026-08-24
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20260824_01"
down_revision = None
branch_labels = None
depends_on = None


def _contact_pair_constraint(prefix: str) -> sa.CheckConstraint:
    return sa.CheckConstraint(
        "(contact_public IS NULL AND contact_detail IS NULL) OR "
        "(contact_public IS NOT NULL AND contact_detail IS NOT NULL)",
        name=f"ck_{prefix}_contact_pair",
    )


def upgrade() -> None:
    op.create_table(
        "found_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("found_location_name", sa.String(120), nullable=False),
        sa.Column("found_latitude", sa.Float(), nullable=False),
        sa.Column("found_longitude", sa.Float(), nullable=False),
        sa.Column("found_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("storage_place", sa.String(200), nullable=True),
        sa.Column("contact_public", sa.Boolean(), nullable=True),
        sa.Column("contact_detail", sa.String(300), nullable=True),
        sa.CheckConstraint("found_latitude BETWEEN -90 AND 90", name="ck_found_items_latitude"),
        sa.CheckConstraint("found_longitude BETWEEN -180 AND 180", name="ck_found_items_longitude"),
        _contact_pair_constraint("found_items"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_found_items_category", "found_items", ["category"])
    op.create_index("ix_found_items_found_date", "found_items", ["found_date"])
    op.create_index(
        "ix_found_items_map", "found_items", ["category", "found_latitude", "found_longitude"]
    )

    op.create_table(
        "lost_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("lost_location_name", sa.String(120), nullable=False),
        sa.Column("lost_latitude", sa.Float(), nullable=False),
        sa.Column("lost_longitude", sa.Float(), nullable=False),
        sa.Column("lost_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("contact_public", sa.Boolean(), nullable=True),
        sa.Column("contact_detail", sa.String(300), nullable=True),
        sa.CheckConstraint("lost_latitude BETWEEN -90 AND 90", name="ck_lost_items_latitude"),
        sa.CheckConstraint("lost_longitude BETWEEN -180 AND 180", name="ck_lost_items_longitude"),
        _contact_pair_constraint("lost_items"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lost_items_category", "lost_items", ["category"])
    op.create_index("ix_lost_items_lost_date", "lost_items", ["lost_date"])

    op.create_table(
        "match_results",
        sa.Column("lost_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("found_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column(
            "reasons",
            postgresql.ARRAY(sa.String(200)),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("question", sa.String(500), nullable=True),
        sa.CheckConstraint("score BETWEEN 0 AND 1", name="ck_match_results_score"),
        sa.ForeignKeyConstraint(["found_item_id"], ["found_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lost_item_id"], ["lost_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("lost_item_id", "found_item_id"),
    )
    op.create_index("ix_match_results_score", "match_results", ["score"])
    op.create_index("ix_match_results_lost_score", "match_results", ["lost_item_id", "score"])


def downgrade() -> None:
    op.drop_table("match_results")
    op.drop_table("lost_items")
    op.drop_table("found_items")
