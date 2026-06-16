import uuid
import uvicorn
import bcrypt
import os
import enum
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum, Date, Boolean, Table
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt
from dotenv import load_dotenv
import requests
from typing import List, Dict, Optional
from math import floor

load_dotenv()

# --- ENUMS ---
class TipoSala(str, enum.Enum):
    STANDARD = "STANDARD"
    KINO_EVOLUTION = "KINO_EVOLUTION"
    PLATINUM = "PLATINUM"

class TipoIngresso(str, enum.Enum):
    INTEIRA = "INTEIRA"
    MEIA = "MEIA"
    ITAU_PROMO = "ITAU_PROMO"

class StatusAssento(str, enum.Enum):
    DISPONIVEL = "DISPONIVEL"
    OCUPADO = "OCUPADO"
    MANUTENCAO = "MANUTENCAO"

class StatusPagamento(str, enum.Enum):
    PENDENTE = "PENDENTE"
    CONFIRMADO = "CONFIRMADO"
    CANCELADO = "CANCELADO"

# --- DATABASE CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, 'kinoplex.db')
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{db_path}")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DATABASE MODELS ---
class UserDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    reservas = relationship("ReservaDB", back_populates="usuario")

class FilmeDB(Base):
    __tablename__ = "filmes"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String)
    sinopse = Column(String)
    duracao = Column(String)
    genero = Column(String)
    classificacao = Column(String)
    lote = Column(Integer, default=1)
    elenco = Column(String, nullable=True)
    sessoes = relationship("SessaoDB", back_populates="filme")

class SalaDB(Base):
    __tablename__ = "salas"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String, unique=True)
    tipo = Column(SQLEnum(TipoSala), default=TipoSala.STANDARD)
    capacidade = Column(Integer)
    sessoes = relationship("SessaoDB", back_populates="sala")
    assentos = relationship("AssentoDB", back_populates="sala")

class SessaoDB(Base):
    __tablename__ = "sessoes"
    id = Column(Integer, primary_key=True, index=True)
    filme_id = Column(Integer, ForeignKey("filmes.id"))
    sala_id = Column(Integer, ForeignKey("salas.id"))
    data = Column(Date)
    horario = Column(String)
    preco_base = Column(Float)
    filme = relationship("FilmeDB", back_populates="sessoes")
    sala = relationship("SalaDB", back_populates="sessoes")
    assentos = relationship("AssentoDB", back_populates="sessao")
    reservas = relationship("ReservaDB", back_populates="sessao")

class AssentoDB(Base):
    __tablename__ = "assentos"
    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes.id"), index=True)
    sala_id = Column(Integer, ForeignKey("salas.id"), index=True)
    fileira = Column(String)
    numero = Column(Integer)
    tamanho = Column(String, default="NORMAL")
    status = Column(SQLEnum(StatusAssento), default=StatusAssento.DISPONIVEL)
    sessao = relationship("SessaoDB", back_populates="assentos")
    sala = relationship("SalaDB", back_populates="assentos")

# Junção reserva <-> assentos (1 reserva = N assentos).
# assento_id único impede que o mesmo assento entre em duas reservas
# (proteção de double-booking no nível do banco).
reserva_assentos = Table(
    "reserva_assentos",
    Base.metadata,
    Column("reserva_id", Integer, ForeignKey("reservas.id"), primary_key=True),
    Column("assento_id", Integer, ForeignKey("assentos.id"), primary_key=True, unique=True),
)

class ReservaDB(Base):
    __tablename__ = "reservas"
    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes.id"), index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ingressos = relationship("IngressoDB", back_populates="reserva")
    sessao = relationship("SessaoDB", back_populates="reservas")
    assentos = relationship("AssentoDB", secondary=reserva_assentos, backref="reservas")
    usuario = relationship("UserDB", back_populates="reservas")

class IngressoDB(Base):
    __tablename__ = "ingressos"
    id = Column(Integer, primary_key=True, index=True)
    reserva_id = Column(Integer, ForeignKey("reservas.id"), index=True)
    tipo = Column(SQLEnum(TipoIngresso))
    valor = Column(Float)
    data_emissao = Column(DateTime, default=datetime.utcnow)
    reserva = relationship("ReservaDB", back_populates="ingressos")

class PagamentoDB(Base):
    __tablename__ = "pagamentos"
    id = Column(Integer, primary_key=True, index=True)
    reserva_id = Column(Integer, ForeignKey("reservas.id"), index=True)
    metodo = Column(String)
    valor_total = Column(Float)
    status = Column(SQLEnum(StatusPagamento), default=StatusPagamento.PENDENTE)
    timestamp = Column(DateTime, default=datetime.utcnow)

# --- SECURITY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

SECRET_KEY = os.getenv("SECRET_KEY", "minha_chave_super_secreta_kinoplex")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user = db.query(UserDB).filter(UserDB.email == email).first()
        if not user:
            raise HTTPException(status_code=401)
        return user
    except JWTError:
        raise HTTPException(status_code=401)

# --- PYDANTIC MODELS ---
class UserCreate(BaseModel):
    nome: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    nome: str
    email: str

class AssentoResponse(BaseModel):
    id: int
    fileira: str
    numero: int
    tamanho: str
    status: str

class IngressoCreate(BaseModel):
    tipo: str
    quantidade: int

class PagamentoCreate(BaseModel):
    metodo: str
    ingressos: List[IngressoCreate]

class ReservaCreate(BaseModel):
    sessao_id: int
    assentos: List[int]

class SessaoResponse(BaseModel):
    id: int
    filme_id: int
    sala_id: int
    data: str
    horario: str
    preco_base: float

# --- LOGIC FUNCTIONS ---
def calcular_preco_sala(preco_base: float, tipo_sala: TipoSala) -> float:
    if tipo_sala == TipoSala.STANDARD:
        return preco_base
    elif tipo_sala == TipoSala.KINO_EVOLUTION:
        return preco_base * 1.20
    elif tipo_sala == TipoSala.PLATINUM:
        return preco_base * 1.50
    return preco_base

def calcular_preco_ingresso(preco_sala: float, tipo_ingresso: TipoIngresso) -> float:
    if tipo_ingresso == TipoIngresso.INTEIRA:
        return preco_sala
    elif tipo_ingresso == TipoIngresso.MEIA:
        return preco_sala * 0.50
    elif tipo_ingresso == TipoIngresso.ITAU_PROMO:
        return preco_sala * 0.80
    return preco_sala

def get_lote_filmes(hora_atual: datetime = None) -> int:
    if hora_atual is None:
        hora_atual = datetime.now()
    hora = hora_atual.hour
    return 1 if hora < 12 else 2

def criar_assentos_para_sala(db: Session, sala: SalaDB, sessao: SessaoDB):
    fileiras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    assentos_por_fileira = 12

    for fileira in fileiras:
        for numero in range(1, assentos_por_fileira + 1):
            # Regra Kinoplex: Cadeiras da ponta (1 a 3 e as 3 últimas) nas fileiras A, B, C (1ª à 3ª) e H (última)
            is_ponta = numero in [1, 2, 3, assentos_por_fileira - 2, assentos_por_fileira - 1, assentos_por_fileira]
            tamanho = "GRANDE" if is_ponta and fileira in ['A', 'B', 'C', 'H'] else "NORMAL"

            assento = AssentoDB(
                sessao_id=sessao.id,
                sala_id=sala.id,
                fileira=fileira,
                numero=numero,
                tamanho=tamanho,
                status=StatusAssento.DISPONIVEL
            )
            db.add(assento)
    db.commit()

# --- FASTAPI APP ---
app = FastAPI(title="API Kinoplex Refatorada")
origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

# --- AUTH ROUTES ---
@app.post("/auth/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(UserDB).filter(UserDB.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    new_user = UserDB(
        nome=user.nome,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"mensagem": "Usuário criado com sucesso!", "user_id": new_user.id}

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")

    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "nome": user.nome, "email": user.email}
    }

@app.get("/auth/me")
async def get_me(current_user: UserDB = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nome": current_user.nome,
        "email": current_user.email
    }

# --- FILME ROUTES ---
@app.get("/api/filmes")
async def listar_filmes(db: Session = Depends(get_db)):
    lote_atual = get_lote_filmes()
    filmes = db.query(FilmeDB).filter(FilmeDB.lote == lote_atual).all()

    resultado = []
    for f in filmes:
        sessoes = db.query(SessaoDB).filter(SessaoDB.filme_id == f.id).all()
        resultado.append({
            "id": f.id,
            "titulo": f.titulo,
            "sinopse": f.sinopse,
            "duracao": f.duracao,
            "genero": f.genero,
            "classificacao": f.classificacao,
            "lote": f.lote,
            "elenco": f.elenco,
            "sessoes": [
                {
                    "id": s.id,
                    "data": s.data.isoformat(),
                    "horario": s.horario,
                    "sala": s.sala.numero,
                    "tipo_sala": s.sala.tipo.value,
                    "preco_base": s.preco_base
                }
                for s in sessoes
            ]
        })
    return resultado

@app.get("/api/filmes/cartaz/{data}")
async def filmes_por_data(data: str, db: Session = Depends(get_db)):
    from datetime import datetime as dt
    data_obj = dt.fromisoformat(data).date()

    sessoes = db.query(SessaoDB).filter(SessaoDB.data == data_obj).all()
    filmes_ids = list(set([s.filme_id for s in sessoes]))
    filmes = db.query(FilmeDB).filter(FilmeDB.id.in_(filmes_ids)).all()

    resultado = []
    for f in filmes:
        sessoes_filme = [s for s in sessoes if s.filme_id == f.id]
        resultado.append({
            "id": f.id,
            "titulo": f.titulo,
            "sinopse": f.sinopse,
            "duracao": f.duracao,
            "genero": f.genero,
            "classificacao": f.classificacao,
            "elenco": f.elenco,
            "sessoes": [
                {
                    "id": s.id,
                    "horario": s.horario,
                    "sala": s.sala.numero,
                    "tipo_sala": s.sala.tipo.value,
                    "preco_base": s.preco_base
                }
                for s in sessoes_filme
            ]
        })
    return resultado

# --- SALA ROUTES ---
@app.get("/api/salas")
async def listar_salas(db: Session = Depends(get_db)):
    salas = db.query(SalaDB).all()
    return [
        {
            "id": s.id,
            "numero": s.numero,
            "tipo": s.tipo.value,
            "capacidade": s.capacidade
        }
        for s in salas
    ]

# --- SESSAO ROUTES ---
@app.get("/api/sessao/{sessao_id}")
async def obter_sessao(sessao_id: int, db: Session = Depends(get_db)):
    sessao = db.query(SessaoDB).filter(SessaoDB.id == sessao_id).first()
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    assentos = db.query(AssentoDB).filter(AssentoDB.sessao_id == sessao_id).all()
    preco_sala = calcular_preco_sala(sessao.preco_base, sessao.sala.tipo)

    return {
        "id": sessao.id,
        "filme": {
            "id": sessao.filme.id,
            "titulo": sessao.filme.titulo,
            "sinopse": sessao.filme.sinopse,
            "duracao": sessao.filme.duracao,
            "genero": sessao.filme.genero,
            "classificacao": sessao.filme.classificacao,
            "elenco": sessao.filme.elenco
        },
        "sala": {
            "numero": sessao.sala.numero,
            "tipo": sessao.sala.tipo.value,
            "capacidade": sessao.sala.capacidade
        },
        "data": sessao.data.isoformat(),
        "horario": sessao.horario,
        "preco_base": sessao.preco_base,
        "preco_sala": preco_sala,
        "preco_ingresso": {
            "inteira": calcular_preco_ingresso(preco_sala, TipoIngresso.INTEIRA),
            "meia": calcular_preco_ingresso(preco_sala, TipoIngresso.MEIA),
            "itau_promo": calcular_preco_ingresso(preco_sala, TipoIngresso.ITAU_PROMO)
        },
        "assentos": [
            {
                "id": a.id,
                "fileira": a.fileira,
                "numero": a.numero,
                "tamanho": a.tamanho,
                "status": a.status.value
            }
            for a in assentos
        ]
    }

# --- ASSENTO ROUTES ---
@app.get("/api/assentos/{sessao_id}")
async def listar_assentos(sessao_id: int, db: Session = Depends(get_db)):
    assentos = db.query(AssentoDB).filter(AssentoDB.sessao_id == sessao_id).all()

    return {
        "assentos": [
            {
                "id": a.id,
                "fileira": a.fileira,
                "numero": a.numero,
                "tamanho": a.tamanho,
                "status": a.status.value
            }
            for a in assentos
        ]
    }

# --- RESERVA ROUTES ---
@app.post("/api/reservas")
async def criar_reserva(
    reserva: ReservaCreate,
    pagamento: PagamentoCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    sessao = db.query(SessaoDB).filter(SessaoDB.id == reserva.sessao_id).first()
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    assentos_db = db.query(AssentoDB).filter(
        AssentoDB.sessao_id == reserva.sessao_id,
        AssentoDB.id.in_(reserva.assentos)
    ).all()

    if len(assentos_db) != len(reserva.assentos):
        raise HTTPException(status_code=400, detail="Assentos inválidos")

    for assento in assentos_db:
        if assento.status != StatusAssento.DISPONIVEL:
            raise HTTPException(status_code=400, detail=f"Assento {assento.fileira}{assento.numero} não disponível")

    preco_sala = calcular_preco_sala(sessao.preco_base, sessao.sala.tipo)
    valor_total = 0.0

    nova_reserva = ReservaDB(
        sessao_id=reserva.sessao_id,
        user_id=current_user.id
    )
    nova_reserva.assentos = assentos_db
    db.add(nova_reserva)
    db.flush()

    for pg in pagamento.ingressos:
        tipo_ingresso = TipoIngresso[pg.tipo]
        preco = calcular_preco_ingresso(preco_sala, tipo_ingresso)

        for _ in range(pg.quantidade):
            ingresso = IngressoDB(
                reserva_id=nova_reserva.id,
                tipo=tipo_ingresso,
                valor=preco
            )
            db.add(ingresso)
            valor_total += preco

    for assento in assentos_db:
        assento.status = StatusAssento.OCUPADO

    pgt = PagamentoDB(
        reserva_id=nova_reserva.id,
        metodo=pagamento.metodo,
        valor_total=valor_total,
        status=StatusPagamento.CONFIRMADO
    )
    db.add(pgt)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Um ou mais assentos já foram reservados. Atualize e tente novamente."
        )

    codigo_reserva = str(uuid.uuid4())[:8].upper()

    return {
        "status": "sucesso",
        "mensagem": "Reserva confirmada!",
        "reserva_id": codigo_reserva,
        "detalhes": {
            "assentos": [f"{a.fileira}{a.numero}" for a in assentos_db],
            "ingressos_total": sum(ing.quantidade for ing in pagamento.ingressos),
            "valor_total": valor_total,
            "metodo_pagamento": pagamento.metodo
        }
    }

@app.get("/api/minhas-reservas")
async def listar_minhas_reservas(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    reservas = db.query(ReservaDB).filter(ReservaDB.user_id == current_user.id).all()

    return [
        {
            "id": r.id,
            "filme": r.sessao.filme.titulo,
            "data": r.sessao.data.isoformat(),
            "horario": r.sessao.horario,
            "sala": r.sessao.sala.numero,
            "assentos": [f"{a.fileira}{a.numero}" for a in r.assentos],
            "data_reserva": r.timestamp.strftime("%d/%m/%Y %H:%M"),
            "ingressos": [
                {"tipo": ing.tipo.value, "valor": ing.valor}
                for ing in r.ingressos
            ]
        }
        for r in reservas
    ]

# --- CALENDARIO ROUTES ---
@app.get("/api/calendario/{ano}/{mes}")
async def obter_calendario(ano: int, mes: int, db: Session = Depends(get_db)):
    from datetime import datetime as dt, date

    primeiro_dia = date(ano, mes, 1)
    if mes == 12:
        ultimo_dia = date(ano + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo_dia = date(ano, mes + 1, 1) - timedelta(days=1)

    sessoes = db.query(SessaoDB).filter(
        SessaoDB.data >= primeiro_dia,
        SessaoDB.data <= ultimo_dia
    ).all()

    dias_com_sessoes = {}
    for s in sessoes:
        dia = s.data.day
        if dia not in dias_com_sessoes:
            dias_com_sessoes[dia] = []
        dias_com_sessoes[dia].append({
            "filme_id": s.filme_id,
            "filme_titulo": s.filme.titulo,
            "horario": s.horario,
            "sala": s.sala.numero
        })

    return {
        "mes": mes,
        "ano": ano,
        "dias_com_sessoes": dias_com_sessoes
    }

# --- SEED ---
def seed_database():
    db = SessionLocal()

    if db.query(SalaDB).count() == 0:
        salas_config = [
            ("01", TipoSala.STANDARD, 96),
            ("02", TipoSala.STANDARD, 96),
            ("03", TipoSala.KINO_EVOLUTION, 120),
            ("04", TipoSala.PLATINUM, 60),
        ]

        for numero, tipo, capacidade in salas_config:
            sala = SalaDB(numero=numero, tipo=tipo, capacidade=capacidade)
            db.add(sala)
        db.commit()

    if db.query(FilmeDB).count() == 0:
        filmes_config = [
            ("Duna 2", "Épico de ficção científica", "166 min", "Ficção", "14", 1, "Timothée Chalamet, Zendaya"),
            ("Oppenheimer", "Drama histórico", "180 min", "Drama", "12", 1, "Cillian Murphy, Emily Blunt"),
            ("Barbie", "Comédia fantasia", "114 min", "Comédia", "10", 2, "Margot Robbie, Ryan Gosling"),
            ("Killers of the Flower Moon", "Thriller", "150 min", "Thriller", "14", 2, "Leonardo DiCaprio, Lily Gladstone"),
            ("Insidious 5", "Horror", "107 min", "Horror", "14", 1, "Patrick Wilson, Rose Byrne"),
            ("Poor Things", "Ficção", "141 min", "Ficção", "16", 2, "Emma Stone, Mark Ruffalo"),
            ("Deadpool & Wolverine", "Ação e Comédia", "127 min", "Ação", "18", 1, "Ryan Reynolds, Hugh Jackman"),
            ("Divertida Mente 2", "Animação Família", "96 min", "Animação", "Livre", 1, "Amy Poehler, Maya Hawke"),
            ("Coringa: Delírio a Dois", "Suspense Musical", "138 min", "Suspense", "16", 2, "Joaquin Phoenix, Lady Gaga"),
            ("Gladiador 2", "Ação Épica", "150 min", "Ação", "16", 2, "Paul Mescal, Pedro Pascal"),
            ("Venom 3", "Ação/Comédia", "120 min", "Ação", "16", 1, "Tom Hardy, Juno Temple"),
            ("Nosferatu", "Horror/Suspense", "132 min", "Horror", "18", 2, "Bill Skarsgård, Lily-Rose Depp"),
        ]

        for titulo, sinopse, duracao, genero, classificacao, lote, elenco in filmes_config:
            filme = FilmeDB(
                titulo=titulo,
                sinopse=sinopse,
                duracao=duracao,
                genero=genero,
                classificacao=classificacao,
                lote=lote,
                elenco=elenco
            )
            db.add(filme)
        db.commit()

    if db.query(SessaoDB).count() == 0:
        filmes = db.query(FilmeDB).all()
        salas = db.query(SalaDB).all()

        from datetime import date
        hoje = date.today()
        horarios = ["14:00", "16:30", "19:00", "21:30"]

        for i, filme in enumerate(filmes):
            for j, sala in enumerate(salas):
                for k, horario in enumerate(horarios):
                    data = hoje + timedelta(days=(i * 2 + j + k) % 30)
                    sessao = SessaoDB(
                        filme_id=filme.id,
                        sala_id=sala.id,
                        data=data,
                        horario=horario,
                        preco_base=50.0
                    )
                    db.add(sessao)
                    db.flush()
                    criar_assentos_para_sala(db, sala, sessao)

        db.commit()

    db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_database()
    print("🚀 Servidor Kinoplex Refatorado: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)
