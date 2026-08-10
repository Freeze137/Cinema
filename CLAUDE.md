# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar no código deste repositório.

## Projeto

Kinoplekis ("Kinoplex") — aplicação full-stack de reserva de ingressos de cinema. Backend FastAPI + SQLAlchemy + SQLite, frontend React 19 + TypeScript + Vite + Tailwind v4. Código, documentação e este arquivo são em português (pt-BR); mantenha a convenção.

## Comandos

### Backend (rodar a partir de `backend/`)
```bash
venv\Scripts\activate          # Windows; venv/ fica na raiz
cd backend
python main.py                 # sobe em http://127.0.0.1:8000, docs em /docs
```
- `python main.py` é o **único** caminho que chama `Base.metadata.create_all()` + `seed_database()` (ambos dentro do bloco `if __name__ == "__main__"`, linhas ~657-661). Subir via `uvicorn main:app` pula a criação do banco e o seed — não use isso no primeiro boot.
- Resetar dados sem derrubar o esquema: `cd backend && python limpar_banco.py` (apaga reservas e devolve todos os assentos para `DISPONIVEL`).
- Reset completo: apagar o arquivo `.db` e rodar `python main.py`, que popula de novo.
- Alembic está configurado (`alembic.ini`, `alembic/versions/`), mas o runtime cria o esquema com `create_all`, não com migrações. `alembic upgrade head` só importa ao editar migrações.

### Frontend (rodar a partir de `front/`)
```bash
cd front
npm install
npm run dev        # http://127.0.0.1:5173 (Vite)
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview
```

Não existem testes automatizados em nenhum dos dois lados.

## Armadilha do caminho do banco

O banco canônico é `backend/kinoplex.db`. Como cada ponto resolve o caminho:
- `backend/main.py`: `BASE_DIR/kinoplex.db` → `backend/kinoplex.db` (absoluto, independente do cwd). A variável de ambiente `DATABASE_URL` sobrescreve se estiver definida, mas o `.env` não a define mais (antes apontava para `./backend/kinoplex.db`, o que com cwd=`backend/` gerava o aninhamento espúrio `backend/backend/kinoplex.db` — o bug foi corrigido removendo a variável).
- `alembic.ini`: caminho absoluto fixo para `backend/kinoplex.db`.
- `backend/limpar_banco.py`: caminho relativo `kinoplex.db`, então rode **de dentro de `backend/`**.

## Migrações (Alembic)

O esquema nasce do `create_all` no primeiro `python main.py`, mas o Alembic é a fonte da verdade para *mudanças* de esquema. O banco em uso está carimbado no head atual. Fluxo:
```bash
venv\Scripts\activate
python -m alembic current          # mostra a revisão aplicada
python -m alembic upgrade head     # aplica migrações pendentes
python -m alembic downgrade -1     # volta uma
```
`alembic/env.py` importa `Base` de `backend/main.py` e roda com `render_as_batch=True` (necessário para remover/alterar colunas no SQLite). As migrações são escritas de forma defensiva (inspecionam tabelas e colunas antes de alterar), então funcionam tanto num banco vindo de `create_all` quanto de uma migração anterior.

## Arquitetura do backend (`backend/main.py`, arquivo único de ~1100 linhas)

Tudo — enums, modelos ORM, schemas Pydantic, helpers de autenticação, regras de negócio, todas as rotas e o seed — vive em `main.py`.

**Modelos:** `UserDB`, `FilmeDB`, `SalaDB`, `SessaoDB`, `AssentoDB`, `ReservaDB`, `IngressoDB`, `PagamentoDB`. Enums: `TipoSala` (STANDARD / KINO_EVOLUTION / PLATINUM), `TipoIngresso` (INTEIRA / MEIA / ITAU_PROMO), `CategoriaMeia` (10 valores, agrupados em `convenio` e `lei` — faixas Sicoob, Estudante, Sênior, PCD/Autista, Acompanhante PCD, Professor, Outras Lei), `StatusAssento` (DISPONIVEL / OCUPADO / MANUTENCAO), `StatusPagamento`. `IngressoDB.categoria_meia` só é preenchido quando `tipo == MEIA`; o espelho no frontend é `front/src/components/meiaEntrada.ts` e os ids precisam bater.

**Autenticação:** JWT (`python-jose`) + hash bcrypt. Bearer token via `oauth2_scheme`; proteja rotas com `Depends(get_current_user)`. O CORS está totalmente aberto (`allow_origins=["*"]`).

**Duas regras de negócio centrais:**
1. **Rotação de filmes a cada 12 horas** — `get_lote_filmes()` devolve lote 1 (00:00–11:59) ou lote 2 (12:00–23:59) conforme o relógio do servidor; `GET /api/filmes` retorna apenas o lote ativo. Para ver filmes diferentes, mude a hora do sistema ou consulte em outro horário.
2. **Preço em camadas** — `calcular_preco_sala(preco_base, tipo_sala)` (Standard ×1,0, KinoEvolution ×1,2, Platinum ×1,5) alimenta `calcular_preco_ingresso(preco_sala, tipo_ingresso)` (Inteira ×1,0, Meia ×0,5, Itaú ×0,8). Calculado a cada requisição, nunca armazenado.

**Layout de assentos:** `criar_assentos_para_sala()` monta 8 fileiras (A–H) × 12 assentos; os assentos de canto da primeira e da última fileira são `GRANDE`, o resto `NORMAL`.

**Invariante da reserva** (`POST /api/reservas`): a quantidade total de ingressos precisa ser igual ao número de assentos selecionados; os assentos viram `OCUPADO` no sucesso. Uma reserva liga N assentos pela tabela de junção `reserva_assentos`; `assento_id` é único ali, então o próprio banco impede dupla marcação (o commit está envolto em `try/except IntegrityError` → HTTP 409). `GET /api/minhas-reservas` retorna `assentos: string[]` (não um único `assento`).

**Observação:** `WebSocket`/`WebSocketDisconnect` estão importados, mas nenhuma rota de websocket foi ligada ainda.

Mapa de rotas (todas em main.py): `/auth/{register,login,me}`, `/api/filmes`, `/api/filmes/cartaz/{data}`, `/api/salas`, `/api/precos`, `/api/sessao/{id}`, `/api/assentos/{sessao_id}`, `/api/pix/cobranca`, `/api/reservas`, `/api/minhas-reservas`, `/api/calendario/{ano}/{mes}`.

## Arquitetura do frontend (`front/src/`)

SPA React enxuta. Três páginas sustentam a aplicação:
- `pages/Home.tsx` — grade inicial com os filmes do lote ativo + modal de calendário (`GET /api/calendario`).
- `pages/SeatSelection.tsx` — o checkout inteiro como uma máquina de estados de 4 etapas (`etapa`: assentos → ingressos → pagamento → sucesso). Guarda assentos escolhidos, contagem de ingressos e forma de pagamento; valida a regra ingressos==assentos no cliente antes do `POST /api/reservas`.
- `pages/Login.tsx` — autenticação.

`contexts/AuthContext.tsx` guarda o usuário logado + token. `services/api.ts` é uma instância axios crua com `http://127.0.0.1:8000` fixo (atenção: existe também um `src/api.ts` obsoleto — o cliente canônico é `src/services/api.ts`). Roteamento com `react-router-dom` v7 em `App.tsx`. Tailwind v4 via `@tailwindcss/vite` (sem arquivo de config separado).

## Documentos de referência

`REFACTORING.md` é a especificação mais completa (modelos, endpoints, exemplos de requisição/resposta, fluxos de negócio). `SETUP_GUIDE.md` tem exemplos com curl e dados do seed. `CHANGELOG.md` registra as mudanças.

## Estado do projeto e decisões vigentes

**O que este projeto é:** peça de portfólio tratada como produto, não exercício de estudo. Ele ganha link ao vivo, como todos os outros projetos do portfólio. "Funciona na minha máquina" não é o padrão aceitável.

**Onde está:** o site está essencialmente completo — catálogo (hoje e próximos dias), sessões, mapa de assentos, checkout com cartão 3D / parcelamento / PIX, aba de preços, blog, página institucional. O que falta é a **aba Totem** (`/totem`), simulação de terminal de autoatendimento. Especificação completa em **`docs/PLANO-TOTEM.md`** — leia antes de mexer em qualquer coisa relacionada ao totem.

**Decisões vigentes.** Fechadas em sessão de arquitetura; não reproponha as alternativas descartadas sem um motivo novo:

- **O totem é uma aba deste site** (`/totem`), não uma aplicação separada. Layout de quiosque, releitura na linguagem visual do próprio projeto em vez de cópia do terminal real.
- **Recorte site vs totem:** o site mostra hoje e os próximos dias; o totem mostra **apenas o dia corrente** — a pessoa está fisicamente no cinema.
- **Bomboniere sempre atrelada a um ingresso**, nunca avulsa (cinema de shopping — a praça de alimentação fica ao lado). `PagamentoDB` mantém a FK `reserva_id`.
- **Sem tela de administração de produtos.** O catálogo vem do seed.
- **Combos são agrupamentos com preço promocional** (`ComboDB` + itens), exibindo a economia contra a soma avulsa. O cliente não escolhe quais itens compõem o combo.
- **Identificação no totem sem senha:** CPF ou e-mail é obrigatório, conta completa não. `ReservaDB.user_id` passa a aceitar nulo. Se o e-mail informado já pertence a um `UserDB`, a compra é vinculada e aparece em `/api/minhas-reservas`.
- **Tipo de ingresso escolhido por assento**, numa tela que lista uma linha por poltrona selecionada (padrão `INTEIRA`), depois da escolha dos assentos.
- **`ITAU_PROMO` é oferecido no totem**, com aviso de que o cartão Itaú precisa ser usado no pagamento — sem divergência de catálogo entre canais.
- **Lógica compartilhada, apresentação separada.** Preço, regras de meia-entrada e disponibilidade de assentos são extraídos para hooks/módulos comuns; as telas do totem são próprias. Explicitamente **não** reaproveitados no totem: `CreditCardPreview` (cartão 3D), `PixCopiaECola` (no quiosque, PIX é QR na tela) e qualquer interação de assento que dependa de hover.
- **Recibo com QR** ao fim da compra no totem (`qrcode` já é dependência). Sem envio por e-mail.

**Lacuna conhecida no modelo:** `IngressoDB` não tem ligação com `AssentoDB` — a reserva guarda N assentos e N ingressos em listas paralelas, e só as contagens são validadas. Tipo de ingresso por assento exige fechar isso com `IngressoDB.assento_id`. Ver `docs/PLANO-TOTEM.md` §3.

**Banco:** SQLite fica por enquanto; Postgres entra no fim. Isso só é barato *se o código continuar agnóstico de dialeto* — **apenas ORM, nada de SQL cru, nada de `func.strftime` ou outra função específica do SQLite**. O único ponto acoplado é `connect_args={"check_same_thread": False}` (linha ~88), que deve virar condicional ao dialeto.

**Docker:** `docker compose up` sobe o projeto inteiro (backend, front, Postgres), com os mesmos Dockerfiles para desenvolvimento e deploy.

**Pendência externa:** fotos do cinema real, a serem colocadas em `docs/referencias/`. Elas definem a paleta e a disposição das telas do totem, e trazem o cardápio real com preços para o seed. Até chegarem, o catálogo de bomboniere é dado provisório — isso não bloqueia nada (ver a ordem de execução no plano).
