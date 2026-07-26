"""Amplia as categorias de meia-entrada para as do Kinoplex

Substitui o conjunto inicial (ESTUDANTE/VIVO/BRADESCO) pelas categorias
realmente oferecidas na bilheteria: cartões Sicoob, estudante, sênior,
PCD/autistas, acompanhante de PCD, professor e outras meias por lei.
A coluna nasceu como VARCHAR(9), curto demais para os novos códigos.

Revision ID: c9e5a3f18d2b
Revises: b8d4f21c6e93
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9e5a3f18d2b'
down_revision: Union[str, Sequence[str], None] = 'b8d4f21c6e93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CATEGORIAS = (
    "SICOOB_MASTERCARD_BLACK", "SICOOB_VISA_INFINITE", "SICOOB_PLATINUM",
    "SICOOB", "ESTUDANTE", "SENIOR", "PCD_AUTISTA", "ACOMPANHANTE_PCD",
    "PROFESSOR", "OUTRAS_LEI",
)


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if "ingressos" not in insp.get_table_names():
        return

    existentes = {c["name"] for c in insp.get_columns("ingressos")}
    if "categoria_meia" not in existentes:
        with op.batch_alter_table("ingressos") as batch_op:
            batch_op.add_column(
                sa.Column("categoria_meia", sa.Enum(*CATEGORIAS, name="categoriameia"), nullable=True)
            )
        return

    # VIVO e BRADESCO não existem mais; viram convênio genérico por lei/acordo.
    bind.execute(sa.text(
        "UPDATE ingressos SET categoria_meia = 'OUTRAS_LEI' "
        "WHERE categoria_meia IN ('VIVO', 'BRADESCO')"
    ))

    with op.batch_alter_table("ingressos") as batch_op:
        batch_op.alter_column(
            "categoria_meia",
            existing_type=sa.VARCHAR(length=9),
            type_=sa.Enum(*CATEGORIAS, name="categoriameia"),
            existing_nullable=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if "ingressos" not in insp.get_table_names():
        return
    if "categoria_meia" not in {c["name"] for c in insp.get_columns("ingressos")}:
        return

    # Só ESTUDANTE existia nos dois conjuntos; o resto não tem equivalente.
    bind.execute(sa.text(
        "UPDATE ingressos SET categoria_meia = NULL WHERE categoria_meia <> 'ESTUDANTE'"
    ))

    with op.batch_alter_table("ingressos") as batch_op:
        batch_op.alter_column(
            "categoria_meia",
            type_=sa.Enum("ESTUDANTE", "VIVO", "BRADESCO", name="categoriameia"),
            existing_nullable=True,
        )
