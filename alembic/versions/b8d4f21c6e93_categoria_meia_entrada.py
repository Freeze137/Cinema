"""Categoria da meia-entrada nos ingressos

Adiciona ingressos.categoria_meia (ESTUDANTE / VIVO / BRADESCO). É o que
define qual documento o cliente apresenta na entrada. Ingressos antigos
ficam nulos — não havia a informação na época da compra.

Revision ID: b8d4f21c6e93
Revises: a7c3e91b204f
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8d4f21c6e93'
down_revision: Union[str, Sequence[str], None] = 'a7c3e91b204f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if "ingressos" not in insp.get_table_names():
        return

    existentes = {c["name"] for c in insp.get_columns("ingressos")}
    if "categoria_meia" not in existentes:
        with op.batch_alter_table("ingressos") as batch_op:
            batch_op.add_column(
                sa.Column(
                    "categoria_meia",
                    sa.Enum("ESTUDANTE", "VIVO", "BRADESCO", name="categoriameia"),
                    nullable=True,
                )
            )


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if "ingressos" not in insp.get_table_names():
        return

    existentes = {c["name"] for c in insp.get_columns("ingressos")}
    if "categoria_meia" in existentes:
        with op.batch_alter_table("ingressos") as batch_op:
            batch_op.drop_column("categoria_meia")
