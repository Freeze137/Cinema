"""Reserva com multiplos assentos (junção reserva_assentos)

Migra o modelo antigo (ReservaDB.assento_id 1-pra-1) para uma tabela de
junção reserva_assentos com assento_id único. Assim uma reserva passa a
referenciar N assentos, e o mesmo assento não pode entrar em duas reservas
(proteção de double-booking no nível do banco).

Revision ID: f1a2b3c4d5e6
Revises: 2aa77c9f83cc
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '2aa77c9f83cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if "reserva_assentos" not in insp.get_table_names():
        op.create_table(
            "reserva_assentos",
            sa.Column("reserva_id", sa.Integer(), nullable=False),
            sa.Column("assento_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["reserva_id"], ["reservas.id"]),
            sa.ForeignKeyConstraint(["assento_id"], ["assentos.id"]),
            sa.PrimaryKeyConstraint("reserva_id", "assento_id"),
            sa.UniqueConstraint("assento_id", name="uq_reserva_assentos_assento_id"),
        )

    # Migra dados antigos: cada reservas.assento_id vira uma linha na junção.
    cols = [c["name"] for c in insp.get_columns("reservas")]
    if "assento_id" in cols:
        bind.execute(sa.text(
            "INSERT OR IGNORE INTO reserva_assentos (reserva_id, assento_id) "
            "SELECT id, assento_id FROM reservas WHERE assento_id IS NOT NULL"
        ))
        with op.batch_alter_table("reservas") as batch_op:
            batch_op.drop_column("assento_id")


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    cols = [c["name"] for c in insp.get_columns("reservas")]
    if "assento_id" not in cols:
        with op.batch_alter_table("reservas") as batch_op:
            batch_op.add_column(sa.Column("assento_id", sa.Integer(), nullable=True))

    # Restaura o primeiro assento de cada reserva.
    bind.execute(sa.text(
        "UPDATE reservas SET assento_id = ("
        "SELECT assento_id FROM reserva_assentos "
        "WHERE reserva_assentos.reserva_id = reservas.id LIMIT 1)"
    ))

    if "reserva_assentos" in insp.get_table_names():
        op.drop_table("reserva_assentos")
