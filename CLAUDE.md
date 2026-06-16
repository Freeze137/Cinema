# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Kinoplekis ("Kinoplex") — full-stack cinema ticket-booking study project. FastAPI + SQLAlchemy + SQLite backend, React 19 + TypeScript + Vite + Tailwind v4 frontend. Code and docs are in Portuguese (pt-BR); keep that convention.

## Commands

### Backend (run from `backend/`)
```bash
venv\Scripts\activate          # Windows; root-level venv/
cd backend
python main.py                 # serves http://127.0.0.1:8000, docs at /docs
```
- `python main.py` is the **only** path that calls `Base.metadata.create_all()` + `seed_database()` (both live in the `if __name__ == "__main__"` block, lines ~657-661). Importing the app via `uvicorn main:app` skips DB creation and seeding — don't run it that way for first boot.
- Reset data without dropping schema: `cd backend && python limpar_banco.py` (deletes reservas, sets all assentos back to `DISPONIVEL`).
- Full reset: delete the `.db` file, then `python main.py` re-seeds.
- Alembic is configured (`alembic.ini`, `alembic/versions/`) but the runtime uses `create_all` for schema, not migrations. `alembic upgrade head` only matters if editing migrations.

### Frontend (run from `front/`)
```bash
cd front
npm install
npm run dev        # http://127.0.0.1:5173 (Vite)
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview
```

No automated tests exist in either side.

## Database path gotcha

Canonical DB is `backend/kinoplex.db`. Resolution:
- `backend/main.py`: `BASE_DIR/kinoplex.db` → `backend/kinoplex.db` (absolute, cwd-independent). `DATABASE_URL` env var overrides if set, but `.env` no longer sets it (it used to point at `./backend/kinoplex.db`, which under cwd=`backend/` produced the stray nested `backend/backend/kinoplex.db` — that bug is fixed by dropping the var).
- `alembic.ini`: hardcoded absolute path to `backend/kinoplex.db`.
- `backend/limpar_banco.py`: relative `kinoplex.db`, so run it **from inside `backend/`**.

## Migrations (Alembic)

Schema is created by `create_all` on first `python main.py`, but Alembic is the source of truth for schema *changes*. The live DB is stamped at the current head. Workflow:
```bash
venv\Scripts\activate
python -m alembic current          # show applied revision
python -m alembic upgrade head     # apply pending migrations
python -m alembic downgrade -1     # roll back one
```
`alembic/env.py` imports `Base` from `backend/main.py` and runs with `render_as_batch=True` (required for SQLite column drops/alters). Migrations are written defensively (inspect tables/columns before altering) so they're safe whether the DB came from `create_all` or a prior migration.

## Backend architecture (`backend/main.py`, single ~660-line file)

Everything (enums, ORM models, Pydantic schemas, auth helpers, business logic, all routes, seed) lives in `main.py`.

**Models:** `UserDB`, `FilmeDB`, `SalaDB`, `SessaoDB`, `AssentoDB`, `ReservaDB`, `IngressoDB`, `PagamentoDB`. Enums: `TipoSala` (STANDARD / KINO_EVOLUTION / PLATINUM), `TipoIngresso` (INTEIRA / MEIA / ITAU_PROMO), `StatusAssento` (DISPONIVEL / OCUPADO / MANUTENCAO), `StatusPagamento`.

**Auth:** JWT (`python-jose`) + bcrypt hashing. `oauth2_scheme` bearer tokens; protect routes with `Depends(get_current_user)`. CORS is wide open (`allow_origins=["*"]`).

**Two core business rules:**
1. **12-hour movie rotation** — `get_lote_filmes()` returns lote 1 (00:00–11:59) or lote 2 (12:00–23:59) from server clock; `GET /api/filmes` only returns the active lote. To see different movies, change system time or query at a different hour.
2. **Layered pricing** — `calcular_preco_sala(preco_base, tipo_sala)` (Standard ×1.0, KinoEvolution ×1.2, Platinum ×1.5) feeds `calcular_preco_ingresso(preco_sala, tipo_ingresso)` (Inteira ×1.0, Meia ×0.5, Itaú ×0.8). Computed per-request, never stored.

**Seat layout:** `criar_assentos_para_sala()` builds 8 rows (A–H) × 12 seats; corner seats of first/last row are `GRANDE`, rest `NORMAL`.

**Reservation invariant** (`POST /api/reservas`): total ticket quantity must equal number of selected seats; seats flip to `OCUPADO` on success. One reserva links N seats via the `reserva_assentos` junction table; `assento_id` is unique there, so the DB itself blocks double-booking (the commit is wrapped in `try/except IntegrityError` → HTTP 409). `GET /api/minhas-reservas` returns `assentos: string[]` (not a single `assento`).

**Note:** `WebSocket`/`WebSocketDisconnect` are imported but no websocket route is wired up yet.

Route map (all in main.py): `/auth/{register,login,me}`, `/api/filmes`, `/api/filmes/cartaz/{data}`, `/api/salas`, `/api/sessao/{id}`, `/api/assentos/{sessao_id}`, `/api/reservas`, `/api/minhas-reservas`, `/api/calendario/{ano}/{mes}`.

## Frontend architecture (`front/src/`)

Thin React SPA. Three pages carry the app:
- `pages/Home.tsx` — landing grid of active-lote movies + calendar modal (`GET /api/calendario`).
- `pages/SeatSelection.tsx` — the whole checkout as one 4-step state machine (`etapa`: assentos → ingressos → pagamento → sucesso). Holds selected seats, ticket counts, payment method; enforces the tickets==seats rule client-side before `POST /api/reservas`.
- `pages/Login.tsx` — auth.

`contexts/AuthContext.tsx` holds the logged-in user + token. `services/api.ts` is a bare axios instance hardcoded to `http://127.0.0.1:8000` (note: there's also a stale `src/api.ts` — the canonical client is `src/services/api.ts`). Routing via `react-router-dom` v7 in `App.tsx`. Tailwind v4 through `@tailwindcss/vite` (no separate config file).

## Reference docs

`REFACTORING.md` is the most complete spec (models, endpoints, request/response examples, business flows). `SETUP_GUIDE.md` has curl examples and seed data. `CHANGELOG.md` tracks changes.
