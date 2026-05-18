# 🚀 Guia de Setup - Kinoplex Refatorado

## 📦 Pré-requisitos

- Python 3.9+
- Node.js 18+
- npm ou yarn
- Git

## 🔧 Instalação Passo a Passo

### 1. Clone o Repositório

```bash
git clone <seu-repo>
cd Cinema
```

### 2. Setup do Backend

#### 2.1 Criar Ambiente Virtual

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2.2 Instalar Dependências

```bash
pip install -r requirements.txt
```

#### 2.3 Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar .env se necessário (valores padrão funcionam)
```

**Conteúdo do .env:**
```
DATABASE_URL=sqlite:///kinoplex.db
SECRET_KEY=sua_chave_super_secreta_aqui_mude_em_producao
TMDB_API_KEY=opcional
```

#### 2.4 Iniciar Backend

```bash
python main.py
```

✅ Backend disponível em `http://127.0.0.1:8000`  
📚 Documentação interativa em `http://127.0.0.1:8000/docs`

### 3. Setup do Frontend

#### 3.1 Instalar Dependências

```bash
cd front
npm install

# ou com yarn
yarn install
```

#### 3.2 Configurar Variáveis (Opcional)

```bash
# Copiar e editar se necessário
cp .env.example .env.local
```

Defaults estão ok, apontam para `http://127.0.0.1:8000`

#### 3.3 Iniciar Frontend

```bash
npm run dev
```

✅ Frontend disponível em `http://127.0.0.1:5173`

---

## 🎯 Primeiro Uso

### Abrir no Navegador

1. Abra `http://127.0.0.1:5173` no seu navegador

### Registrar Conta

1. Clique em "Entrar" (canto superior direito)
2. Clique em "Criar Conta"
3. Preencha:
   - Nome: Qualquer nome
   - Email: qualquer@email.com
   - Senha: qualquer_senha_123
4. Clique em "Registrar"
5. Faça login com as credenciais

### Comprar Ingresso

1. Na Home, clique em qualquer filme
2. Selecione **Assentos** (clique para selecionar)
3. Clique "Próximo"
4. Selecione **Ingressos** (quantidades)
5. Clique "Prosseguir para Pagamento"
6. Escolha método de pagamento (Cartão/PIX)
7. Preencha dados simulados:
   - Cartão: `4111 1111 1111 1111`
   - Validade: `12/25`
   - CVV: `123`
8. Clique "Confirmar Pagamento"
9. Veja confirmação de sucesso ✅

### Ver Minhas Reservas

1. Clique no ícone de Ticket (sidebar esquerda)
2. Veja histórico de compras

### Explorar Calendário

1. Clique no ícone de Calendário (sidebar esquerda)
2. Selecione um dia
3. Veja sessões disponíveis aquele dia

---

## 🔄 Rotação de Filmes (12 horas)

A rotação muda automaticamente:

- **00:00 - 11:59**: Lote A (Filmes 1-3)
- **12:00 - 23:59**: Lote B (Filmes 4-6)

✅ Teste alterando a hora do sistema ou consultando `GET /api/filmes` em diferentes horários

---

## 📊 Dados Iniciais (Seed)

O backend cria automaticamente:

- **4 Salas**:
  - Sala 01: Standard
  - Sala 02: Standard
  - Sala 03: KinoEvolution
  - Sala 04: Platinum

- **6 Filmes**:
  - Duna 2 (Lote A)
  - Oppenheimer (Lote A)
  - Barbie (Lote B)
  - Killers of the Flower Moon (Lote B)
  - Insidious 5 (Lote A)
  - Poor Things (Lote B)

- **Múltiplas Sessões**: Distribuídas ao longo do mês

---

## 🧪 Testar Endpoints (Postman/cURL)

### 1. Registrar Usuário

```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João",
    "email": "joao@test.com",
    "password": "senha123"
  }'
```

### 2. Login

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=joao@test.com&password=senha123"
```

Copie o `access_token` retornado.

### 3. Listar Filmes (Lote Ativo)

```bash
curl -X GET http://127.0.0.1:8000/api/filmes
```

### 4. Obter Sessão com Preços

```bash
curl -X GET http://127.0.0.1:8000/api/sessao/1
```

### 5. Listar Assentos

```bash
curl -X GET http://127.0.0.1:8000/api/assentos/1
```

### 6. Obter Calendário

```bash
curl -X GET "http://127.0.0.1:8000/api/calendario/2026/5"
```

### 7. Criar Reserva (Autenticado)

```bash
curl -X POST http://127.0.0.1:8000/api/reservas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "sessao_id": 1,
    "assentos": [1, 2],
    "pagamento": {
      "metodo": "cartao",
      "ingressos": [
        {"tipo": "INTEIRA", "quantidade": 1},
        {"tipo": "MEIA", "quantidade": 1}
      ]
    }
  }'
```

### 8. Minhas Reservas (Autenticado)

```bash
curl -X GET http://127.0.0.1:8000/api/minhas-reservas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🧹 Limpar Banco de Dados

Para resetar tudo:

```bash
# 1. Delete o arquivo kinoplex.db
rm backend/kinoplex.db  # Mac/Linux
del backend\kinoplex.db  # Windows

# 2. Reinicie o backend
python backend/main.py
```

Novo banco será criado com seed automático.

---

## 📋 Arquivos Importantes

```
Cinema/
├── REFACTORING.md          ← Documentação completa
├── CHANGELOG.md            ← Histórico de mudanças
├── SETUP_GUIDE.md          ← Este arquivo
├── backend/
│   ├── main.py             ← API FastAPI (✨ REFATORADO)
│   ├── requirements.txt     ← Dependências Python
│   ├── .env.example        ← Template de configuração
│   └── kinoplex.db         ← Banco SQLite (gerado)
└── front/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx                ← Landing (✨ ATUALIZADO)
    │   │   ├── SeatSelection.tsx       ← Checkout (✨ COMPLETO)
    │   │   └── Login.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx         ← Auth (✨ ATUALIZADO)
    │   ├── services/
    │   │   └── api.ts
    │   └── App.tsx
    └── package.json
```

---

## 🐛 Solução de Problemas

### Backend não inicia

```
❌ "Address already in use"
→ Mude a porta em main.py: uvicorn.run(app, port=8001)
```

```
❌ "No module named fastapi"
→ pip install -r requirements.txt
```

```
❌ "database is locked"
→ Feche outras instâncias do backend
→ Delete kinoplex.db e reinicie
```

### Frontend não conecta ao backend

```
❌ "Failed to fetch"
→ Verifique se backend está rodando em 127.0.0.1:8000
→ Verifique CORS (já configurado em main.py)
```

```
❌ "Module not found: lucide-react"
→ npm install
```

### Assentos não aparecem

```
❌ Assets carregando lentamente
→ Verificar aba Network no DevTools
→ Aumentar timeout se necessário
```

### Erro ao criar reserva

```
❌ "Assentos inválidos"
→ Certifique-se de que os IDs correspondem à sessão
→ Verifique se estão disponíveis (status: DISPONIVEL)
```

---

## 📞 Contato & Suporte

- **Documentação**: Veja `REFACTORING.md`
- **Histórico**: Veja `CHANGELOG.md`
- **Logs**: Terminal (backend) e DevTools (frontend)

---

## ✅ Próximas Etapas

1. **Produção**:
   - Trocar `DATABASE_URL` para PostgreSQL
   - Configurar variáveis de segurança
   - Deploy em servidor (Vercel, Render, AWS, etc)

2. **Melhorias**:
   - Adicionar testes automatizados
   - Integrar gateway de pagamento real
   - Implementar notificações por email
   - Adicionar mais tipos de ingresso

3. **Analytics**:
   - Rastrear vendas por sala/filme
   - Relatórios de ocupação
   - Dashboard de gerenciamento

---

**Pronto para começar!** 🎬🍿

Execute os comandos de setup acima e acesse o navegador. Qualquer dúvida, consulte os logs.
