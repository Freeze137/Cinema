"""Parcelamento no pagamento (parcelas, valor_parcela, juros)

Adiciona a pagamentos as colunas de parcelamento do crédito. A taxa é gravada
por pagamento para que mudanças futuras na regra não reescrevam o histórico.
Pagamentos antigos passam a valer como 1x sem juros.

Revision ID: a7c3e91b204f
Revises: f1a2b3c4d5e6
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c3e91b204f'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NOVAS_COLUNAS = {
    "parcelas": sa.Column("parcelas", sa.Integer(), nullable=False, server_default="1"),
    "valor_parcela": sa.Column("valor_parcela", sa.Float(), nullable=True),
    "valor_total_com_juros": sa.Column("valor_total_com_juros", sa.Float(), nullable=True),
    "taxa_juros_mensal": sa.Column("taxa_juros_mensal", sa.Float(), nullable=True, server_default="0"),
}


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if "pagamentos" not in insp.get_table_names():
        return

    existentes = {c["name"] for c in insp.get_columns("pagamentos")}
    with op.batch_alter_table("pagamentos") as batch_op:
        for nome, coluna in NOVAS_COLUNAS.items():
            if nome not in existentes:
                batch_op.add_column(coluna)

    # Backfill: pagamentos anteriores viram 1x sem juros pelo valor já cobrado.
    bind.execute(sa.text(
        "UPDATE pagamentos SET "
        "parcelas = COALESCE(parcelas, 1), "
        "valor_parcela = COALESCE(valor_parcela, valor_total), "
        "valor_total_com_juros = COALESCE(valor_total_com_juros, valor_total), "
        "taxa_juros_mensal = COALESCE(taxa_juros_mensal, 0)"
    ))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if "pagamentos" not in insp.get_table_names():
        return

    existentes = {c["name"] for c in insp.get_columns("pagamentos")}
    with op.batch_alter_table("pagamentos") as batch_op:
        for nome in NOVAS_COLUNAS:
            if nome in existentes:
                batch_op.drop_column(nome)
