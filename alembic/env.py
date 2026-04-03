import sys
import os
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- LÓGICA DE CAMINHO CORRIGIDA PARA A ESTRUTURA DO KINOPLEX ---
current_folder = Path(__file__).parent.resolve()
project_root = current_folder.parent
backend_path = project_root

sys.path.insert(0, str(backend_path))

try:
    from main import Base
except ImportError as e:
    print(f"ERRO: Não foi possível encontrar 'main.py' em {backend_path}")
    raise e

# --- CONFIGURAÇÕES PADRÃO DO ALEMBIC ---
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Executa as migrações em modo 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True  # <--- Habilita suporte ao SQLite
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Executa as migrações em modo 'online'."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            render_as_batch=True  # <--- Habilita suporte ao SQLite
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()