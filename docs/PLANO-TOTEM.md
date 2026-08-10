# Plano — Aba Totem

Simulação de totem de autoatendimento do Kinoplex. Última etapa do projeto.

Este documento é a especificação de execução. As decisões aqui foram fechadas em sessão
de arquitetura e não devem ser reabertas sem motivo novo — a seção **Decisões fechadas**
existe para impedir que uma sessão futura proponha de novo o que já foi descartado.

---

## 1. Contexto

O Kinoplex é um projeto de portfólio tratado como produto, com link ao vivo. O site já
cobre o catálogo completo: filmes de hoje e dos próximos dias, sessões, assentos e
checkout. O que falta é a aba `/totem`.

**Recorte site vs totem:**

| | Site | Totem |
|---|---|---|
| Catálogo | Hoje + próximos dias | Só o dia corrente |
| Navegação | Livre | Linear, com reset por inatividade |
| Identificação | Login com senha | CPF ou e-mail, sem senha |
| Bomboniere | Não tem | Sim, atrelada ao ingresso |
| Entrada | Navbar | Tela de atração ("toque para começar") |

O totem é o corte do dia porque a pessoa está fisicamente no cinema: não existe comprar
para semana que vem num terminal de saguão.

---

## 2. Decisões fechadas

| # | Decisão | Motivo |
|---|---|---|
| D1 | Totem é aba do site (`/totem`), não app separado | Compartilha API e build; separar não traria ganho |
| D2 | Layout de totem reformulado na linguagem visual do projeto | Não é cópia do totem real, é releitura — igual ao resto do Kinoplex |
| D3 | Bomboniere sempre atrelada a um ingresso, nunca avulsa | Cinema de shopping tem praça de alimentação ao lado; venda avulsa não se justifica |
| D4 | Sem admin de bomboniere — catálogo vem do seed | CRUD não agrega ao portfólio |
| D5 | Combo é agrupamento com preço promocional, sem escolha de itens pelo cliente | Meio-termo: mostra modelagem real sem virar máquina de opções |
| D6 | Identificação obrigatória por CPF ou e-mail, sem senha | Ingresso precisa de titular; totem real não faz cadastro |
| D7 | Lógica compartilhada, apresentação separada | Preço e disponibilidade são os mesmos; telas de toque não |
| D8 | Tipo de ingresso escolhido por poltroma, após selecionar assentos | Ver §4 (Q23) |
| D9 | `ITAU_PROMO` aparece no totem, com aviso de validação no pagamento | Evita divergência de catálogo entre canais |
| D10 | SQLite agora, Postgres depois | Linha 87 já lê `DATABASE_URL`; troca custa pouco |
| D11 | Docker compose para o projeto inteiro, dev e deploy | Um comando para subir tudo |
| D12 | Recibo com QR ao final; sem e-mail | `qrcode` já está instalado; e-mail adiciona serviço externo |

**Descartado explicitamente:** venda de bomboniere sem ingresso (D3), admin de produtos
(D4), combos com escolha de itens (D5), cartão 3D animado e PIX copia-e-cola no totem
(§5), envio de comprovante por e-mail (D12).

---

## 3. Lacuna descoberta no modelo atual

`IngressoDB` **não se liga a `AssentoDB`**. Hoje a reserva tem N assentos (via a tabela de
junção `reserva_assentos`) e N ingressos numa lista paralela, e a única garantia é que as
contagens batem (`POST /api/reservas`, invariante documentada no CLAUDE.md).

Isso impede D8: não há onde gravar "a poltrona F7 é meia-estudante". Fechar essa ligação é
pré-requisito do totem e beneficia o site também — hoje é impossível reimprimir um ingresso
sabendo a que assento ele pertence.

**Correção:** `IngressoDB.assento_id` como FK para `assentos`, com `unique` por reserva.
A junção `reserva_assentos` continua existindo (é ela que bloqueia dupla marcação no nível
do banco, via `assento_id` único); a FK nova é o vínculo semântico ingresso↔poltrona.

---

## 4. Modelo de dados

### 4.1 Tabelas novas

```
produtos
  id, nome, descricao, categoria (PIPOCA|BEBIDA|DOCE|SALGADO|COMBO),
  preco, tamanho (P|M|G|UNICO), imagem_url, ativo

combos
  id, nome, descricao, preco_promocional, imagem_url, ativo

combo_itens
  id, combo_id → combos, produto_id → produtos, quantidade

pedido_itens
  id, reserva_id → reservas, produto_id → produtos (nullable),
  combo_id → combos (nullable), quantidade, valor_unitario
```

`pedido_itens` aponta para reserva porque bomboniere não existe sem ingresso (D3). Grava
`valor_unitario` no momento da compra — mesma disciplina já usada em `PagamentoDB.parcelas`,
para que mudança de preço futura não reescreva histórico.

A economia do combo é derivada, nunca armazenada: soma dos `produtos.preco` dos itens menos
`combos.preco_promocional`.

### 4.2 Alterações em tabelas existentes

| Tabela | Alteração | Motivo |
|---|---|---|
| `reservas` | `user_id` passa a `nullable=True` | D6 — compra sem conta |
| `reservas` | `+ cpf` (String, nullable), `+ email` (String, nullable) | D6 — titular sem cadastro |
| `reservas` | `+ canal` (Enum SITE\|TOTEM, default SITE) | Distinguir origem no histórico |
| `reservas` | `+ codigo_retirada` (String, unique) | Recibo (D12) |
| `ingressos` | `+ assento_id` FK → `assentos` | §3 |

**Regra de integridade:** `user_id IS NOT NULL OR cpf IS NOT NULL OR email IS NOT NULL`.
Aplicada na camada de aplicação (SQLite não tem `CHECK` confiável em batch mode).

Se o e-mail informado já pertence a um `UserDB`, a reserva vincula `user_id`
automaticamente e a compra aparece em `/api/minhas-reservas`.

### 4.3 Migração

Uma revisão Alembic, no estilo defensivo já adotado no projeto (inspecionar antes de
alterar, `render_as_batch=True`). Ordem: criar tabelas novas → alterar `reservas` →
alterar `ingressos` → backfill de `codigo_retirada` nas reservas existentes.

---

## 5. Regra que sustenta a troca de banco (D10)

**Só ORM.** Nada de `text()` com SQL cru, nada de `func.strftime` ou qualquer função
específica de SQLite. Datas via `datetime` do Python, agregações via SQLAlchemy.

Único ponto acoplado hoje: `connect_args={"check_same_thread": False}` na linha 88 de
`backend/main.py`, que quebra no Postgres. Torná-lo condicional ao dialeto agora custa três
linhas e elimina o acoplamento inteiro.

---

## 6. API

### Rotas novas

```
GET  /api/totem/cartaz          filmes do dia corrente + sessões + tipos de sala
GET  /api/produtos              catálogo de bomboniere, agrupado por categoria
GET  /api/combos                combos ativos, com itens e economia calculada
POST /api/reservas/totem        cria reserva sem token: identificação + ingressos
                                por assento + itens de bomboniere
GET  /api/reservas/{codigo}     consulta por código de retirada, sem autenticação
```

### Rotas alteradas

- `POST /api/reservas` — aceita `assento_id` em cada ingresso; a invariante
  "quantidade == assentos" continua valendo, e ganha "cada ingresso aponta para um assento
  distinto da reserva".
- `GET /api/minhas-reservas` — retorna também `itens` (bomboniere) e `canal`.

`/api/totem/cartaz` filtra pela data do servidor, não pelo lote de 12h. O lote governa o
catálogo do site; o totem mostra o que está em cartaz hoje.

---

## 7. Frontend

### Rotas

```
/totem              tela de atração
/totem/cartaz       filmes de hoje
/totem/sessao/:id   horários e tipos de sala
/totem/assentos     mapa de poltronas
/totem/ingressos    tipo por poltrona
/totem/bomboniere   produtos e combos
/totem/pagamento
/totem/recibo/:codigo
```

Sub-rotas dentro de um `TotemLayout` — sem navbar, tela cheia, tipografia e alvos de toque
ampliados.

### Compartilhamento (D7)

Extrair para hooks e módulos comuns, consumidos pelas duas apresentações:

| Extrair | De onde | Usado por |
|---|---|---|
| `useDisponibilidadeAssentos` | `SeatSelection.tsx` | site + totem |
| `usePrecoIngresso` | lógica embutida em `SeatSelection.tsx` | site + totem |
| `meiaEntrada.ts` | já é módulo, permanece | site + totem |
| `parcelamento.ts` | já é módulo, permanece | site (totem não parcela) |

`SeatSelection.tsx` é hoje uma máquina de estados de 4 etapas com tudo dentro. A extração
dos hooks é refatoração real, não cosmética — e melhora o site junto (D7, e o pedido de
"reaproveita e melhora").

### O que **não** se reaproveita

- `CreditCardPreview` (cartão 3D) — totem real mostra "insira ou aproxime", não cartão girando.
- `PixCopiaECola` — no totem, PIX é QR grande na tela; ninguém copia e cola num terminal.
- Hover no mapa de assentos — dedo não tem hover; estado de seleção precisa ser visível sem ele.

### Fluxo de tipo de ingresso (D8)

Após escolher as poltronas, uma tela lista **uma linha por poltrona**, cada linha com
seletor de tipo, padrão `INTEIRA`:

- `MEIA` abre o segundo nível com as 10 `CategoriaMeia`, agrupadas em convênio e lei
  (agrupamento já existe em `meiaEntrada.ts`), exibindo o campo `comprovante` como aviso
  de que o documento será conferido na entrada.
- `ITAU_PROMO` exibe aviso de que o cartão Itaú deve ser usado no pagamento (D9).

### Comportamento de quiosque

- Tela de atração antes do fluxo.
- Timeout de inatividade que reseta a compra e volta à atração. Aviso aos 20s
  ("ainda está aí?"), reset aos 30s. Timer pausado durante o pagamento.

---

## 8. Docker (D11)

```
docker-compose.yml
  backend    build ./backend, porta 8000
  front      build ./front, porta 5173
  db         postgres:16, volume nomeado
```

O serviço `db` sobe desde já, mas o backend continua apontando para SQLite por padrão.
Isso permite testar contra Postgres a qualquer momento (`DATABASE_URL` apontando para o
container) sem migrar nada — e torna a troca final (D10) uma mudança de variável de
ambiente, não um projeto.

Dockerfile multi-stage para o front (build Vite → nginx estático).

---

## 9. Ordem de execução

Cada fase fecha com o projeto funcionando. Nada de fase que deixa o repo quebrado.

1. **Fundação** — `check_same_thread` condicional ao dialeto; extrair
   `useDisponibilidadeAssentos` e `usePrecoIngresso` de `SeatSelection.tsx`; site continua
   idêntico ao usuário.
2. **Modelo** — migração Alembic com tabelas novas e alterações (§4); seed com produtos e
   combos provisórios; `/api/produtos` e `/api/combos` no ar.
3. **Ingresso ↔ assento** — fechar a lacuna do §3, atualizar `POST /api/reservas` e o site
   para mandar `assento_id`.
4. **Reserva sem conta** — `POST /api/reservas/totem`, `codigo_retirada`,
   `GET /api/reservas/{codigo}`.
5. **Casca do totem** — `TotemLayout`, tela de atração, timeout, rotas vazias navegáveis.
6. **Fluxo** — cartaz → sessão → assentos → ingressos por poltrona → bomboniere →
   pagamento → recibo com QR.
7. **Docker** — compose, Dockerfiles, README de execução.
8. **Fotos** — substituir dados provisórios de bomboniere pelo cardápio real; ajustar
   paleta e layout conforme as referências.
9. **Postgres** — trocar `DATABASE_URL`, rodar migrações, validar; deploy.

Fases 1–7 não dependem das fotos. A fase 8 é ponto de entrada tardio de propósito: o
catálogo provisório não bloqueia nada.

---

## 10. Pendências

- **Fotos do cinema real** — ainda não estão no repositório. Quando chegarem, colocar em
  `docs/referencias/`. Servem para dois fins: extrair paleta e disposição das telas do
  totem, e transcrever o cardápio com preços para o seed (fase 8).
- **Limpeza** — `backend/backend/` é diretório órfão do bug de path já corrigido;
  `package.json` na raiz duplica dependências que pertencem a `front/`; `front/src/api.ts`
  está obsoleto (o cliente canônico é `services/api.ts`). Remover quando conveniente,
  fora do caminho crítico.
