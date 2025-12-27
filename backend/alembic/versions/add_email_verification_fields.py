"""Add email verification fields

Revision ID: a1b2c3d4e5f6
Revises: 4a4b423dedf7
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '4a4b423dedf7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add verification_code column
    op.add_column(
        'users',
        sa.Column(
            'verification_code',
            sa.String(6),
            nullable=True,
            comment='6-digit email verification code'
        )
    )
    
    # Add verification_code_expires_at column
    op.add_column(
        'users',
        sa.Column(
            'verification_code_expires_at',
            sa.DateTime(),
            nullable=True,
            comment='Verification code expiration time'
        )
    )
    
    # Add verification_attempts column
    op.add_column(
        'users',
        sa.Column(
            'verification_attempts',
            sa.Integer(),
            nullable=False,
            server_default='0',
            comment='Failed verification attempts counter'
        )
    )


def downgrade() -> None:
    op.drop_column('users', 'verification_attempts')
    op.drop_column('users', 'verification_code_expires_at')
    op.drop_column('users', 'verification_code')

