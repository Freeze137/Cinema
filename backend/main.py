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
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt
from dotenv import load_dotenv
import requests
from typing import List, Dict

load_dotenv()

# --- 0. ENUMS DO SISTEMA ---
class TipoAssento(str, enum.Enum):
    NORMAL = "NORMAL"
    VIP = "VIP"

class StatusAssento(str, enum.Enum):
    DISPONIVEL = "DISPONIVEL"
    OCUPADO = "OCUPADO"
    MANUTENCAO = "MANUTENCAO"

# --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, 'kinoplex.db')
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{db_path}")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. MODELOS DAS TABELAS ---
class UserDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String); email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    reservas = relationship("ReservaDB", back_populates="usuario")

class FilmeDB(Base):
    __tablename__ = "filmes"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String); sinopse = Column(String); duracao = Column(String)
    genero = Column(String); classificacao = Column(String)
    sessoes = relationship("SessaoDB", back_populates="filme")

class SessaoDB(Base):
    __tablename__ = "sessoes"
    id = Column(Integer, primary_key=True, index=True)
    filme_id = Column(Integer, ForeignKey("filmes.id"))
    cinema = Column(String); sala = Column(String); horario = Column(String); preco = Column(Float)
    filme = relationship("FilmeDB", back_populates="sessoes")
    assentos = relationship("AssentoDB", back_populates="sessao")
    reservas = relationship("ReservaDB", back_populates="sessao")

class AssentoDB(Base):
    __tablename__ = "assentos"
    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes.id"), index=True)
    codigo = Column(String); tipo = Column(SQLEnum(TipoAssento)); status = Column(SQLEnum(StatusAssento))
    sessao = relationship("SessaoDB", back_populates="assentos")
    reserva = relationship("ReservaDB", back_populates="assento", uselist=False)

class ReservaDB(Base):
    __tablename__ = "reservas"
    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes.id"), index=True)
    assento_id = Column(Integer, ForeignKey("assentos.id"), unique=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    valor_pago = Column(Float); timestamp = Column(DateTime, default=datetime.utcnow)
    sessao = relationship("SessaoDB", back_populates="reservas")
    assento = relationship("AssentoDB", back_populates="reserva")
    usuario = relationship("UserDB", back_populates="reservas")

# --- 3. UTILITÁRIOS E SEGURANÇA ---
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

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
        if not user: raise HTTPException(status_code=401)
        return user
    except JWTError: raise HTTPException(status_code=401)

class UserCreate(BaseModel):
    nome: str; email: str; password: str

class ReservaCreate(BaseModel):
    sessao_id: int
    assentos: list[str]

# --- 4. INICIALIZAÇÃO DA APP ---
app = FastAPI(title="API Novo Kinoplex")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
async def root():
    """ Rota raiz que redireciona automaticamente para a documentação interativa. """
    return RedirectResponse(url="/docs")

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": "Assento ocupado."})

# --- 4.5 WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, sessao_id: int):
        await websocket.accept()
        if sessao_id not in self.active_connections:
            self.active_connections[sessao_id] = []
        self.active_connections[sessao_id].append(websocket)

    def disconnect(self, websocket: WebSocket, sessao_id: int):
        if sessao_id in self.active_connections:
            self.active_connections[sessao_id].remove(websocket)

    async def broadcast(self, message: dict, sessao_id: int):
        if sessao_id in self.active_connections:
            for connection in self.active_connections[sessao_id]:
                await connection.send_json(message)

manager = ConnectionManager()

# --- 5. ROTAS ---
@app.post("/auth/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(UserDB).filter(UserDB.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    new_user = UserDB(nome=user.nome, email=user.email, hashed_password=get_password_hash(user.password))
    db.add(new_user)
    db.commit()
    return {"mensagem": "Usuário criado com sucesso!"}

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/filmes")
async def listar_filmes(db: Session = Depends(get_db)):
    filmes = db.query(FilmeDB).all()
    resultado = []
    for f in filmes:
        resultado.append({
            "id": f.id, "titulo": f.titulo, "sinopse": f.sinopse,
            "sessoes": [{"id": s.id, "horario": s.horario, "sala": s.sala, "preco": s.preco} for s in f.sessoes]
        })
    return resultado

@app.get("/api/sessao/{sessao_id}")
async def obter_sessao(sessao_id: int, db: Session = Depends(get_db)):
    sessao = db.query(SessaoDB).filter(SessaoDB.id == sessao_id).first()
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    assentos_db = db.query(AssentoDB).filter(AssentoDB.sessao_id == sessao_id).all()
    return {
        "filme": {
            "titulo": sessao.filme.titulo, "duracao": sessao.filme.duracao, 
            "avaliacao": sessao.filme.classificacao, "genero": sessao.filme.genero, 
            "sinopse": sessao.filme.sinopse
        },
        "detalhes": {"cinema": sessao.cinema, "sala": sessao.sala, "horario": sessao.horario, "preco_ingresso": sessao.preco},
        "assentos_ocupados": [a.codigo for a in assentos_db if a.status == StatusAssento.OCUPADO]
    }

@app.post("/api/reservas")
async def criar_reserva(reserva: ReservaCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    sessao = db.query(SessaoDB).filter(SessaoDB.id == reserva.sessao_id).first()
    if not sessao: raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    assentos_db = db.query(AssentoDB).filter(AssentoDB.sessao_id == reserva.sessao_id, AssentoDB.codigo.in_(reserva.assentos)).all()
    
    if len(assentos_db) != len(reserva.assentos):
        raise HTTPException(status_code=400, detail="Assentos inválidos.")

    valor_total = 2.50 # Taxa de conveniência
    assentos_detalhes = []
    codigo_reserva = str(uuid.uuid4())[:8].upper()
    
    for a in assentos_db:
        if a.status != StatusAssento.DISPONIVEL: raise HTTPException(status_code=400, detail=f"Assento {a.codigo} ocupado ou em manutenção.")
        
        preco_assento = sessao.preco * 1.2 if a.tipo == TipoAssento.VIP else sessao.preco
        valor_total += preco_assento
        
        a.status = StatusAssento.OCUPADO
        db.add(ReservaDB(sessao_id=reserva.sessao_id, assento_id=a.id, user_id=current_user.id, valor_pago=preco_assento))
        assentos_detalhes.append({"assento": a.codigo, "tipo": a.tipo.value, "valor": preco_assento})
        
    db.commit()

    # Notifica via WebSocket todos que estão olhando a mesma sessão
    await manager.broadcast({
        "event": "seats_updated",
        "sessao_id": reserva.sessao_id,
        "assentos_novos": [a.codigo for a in assentos_db]
    }, reserva.sessao_id)

    return {
        "status": "sucesso", "mensagem": "Reserva confirmada!", "reserva_id": codigo_reserva,
        "detalhes": {"assentos": assentos_detalhes, "taxa": 2.50, "valor_total": valor_total}
    }

@app.websocket("/ws/sessao/{sessao_id}")
async def websocket_sessao(websocket: WebSocket, sessao_id: int):
    await manager.connect(websocket, sessao_id)
    try:
        while True:
            await websocket.receive_text() # Mantém a conexão ativa esperando desconexão
    except WebSocketDisconnect:
        manager.disconnect(websocket, sessao_id)

# NOVA ROTA: Histórico do Usuário
@app.get("/api/minhas-reservas")
async def listar_minhas_reservas(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    reservas = db.query(ReservaDB).filter(ReservaDB.user_id == current_user.id).all()
    return [
        {
            "filme": r.sessao.filme.titulo,
            "horario": r.sessao.horario,
            "sala": r.sessao.sala,
            "assento": r.assento.codigo,
            "data": r.timestamp.strftime("%d/%m/%Y %H:%M")
        } for r in reservas
    ]

# --- 6. STARTUP E SEED ---
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)  # Reativado para criar as tabelas automaticamente
    db_seed = SessionLocal()
    if db_seed.query(FilmeDB).count() == 0:
        print("🌱 Tentando buscar filmes em cartaz no TMDB...")
        tmdb_key = os.getenv("TMDB_API_KEY")
        sucesso_tmdb = False
        if tmdb_key:
            url = f"https://api.themoviedb.org/3/movie/now_playing?api_key={tmdb_key}&language=pt-BR&page=1"
            resp = requests.get(url)
            if resp.status_code == 200:
                for m in resp.json().get('results', [])[:4]: # Pega os 4 primeiros filmes em cartaz
                    f = FilmeDB(titulo=m['title'], sinopse=m['overview'], duracao="120 min", genero="Em Cartaz", classificacao="12")
                    db_seed.add(f); db_seed.commit()
                    s = SessaoDB(filme_id=f.id, cinema="Kinoplex Master", sala="01", horario="20:00", preco=35.0)
                    db_seed.add(s); db_seed.commit()
                    for r in range(8):
                        for c in range(1, 13):
                            db_seed.add(AssentoDB(sessao_id=s.id, codigo=f"{chr(65+r)}{c}", tipo=TipoAssento.NORMAL, status=StatusAssento.DISPONIVEL))
                    db_seed.commit()
                sucesso_tmdb = True
                print("✅ Filmes carregados do TMDB com sucesso!")
        
        if not sucesso_tmdb:
            print("⚠️ Usando filme padrão (TMDB falhou ou sem chave configurada).")
            f1 = FilmeDB(titulo="Duna 2", sinopse="Épico no deserto.", duracao="166 min", genero="Ficção", classificacao="14")
            db_seed.add(f1); db_seed.commit()
            s1 = SessaoDB(filme_id=f1.id, cinema="Kinoplex RioSul", sala="01", horario="20:00", preco=35.0)
            db_seed.add(s1); db_seed.commit()
            for r in range(8):
                for s in range(1, 13):
                    db_seed.add(AssentoDB(sessao_id=s1.id, codigo=f"{chr(65+r)}{s}", tipo=TipoAssento.NORMAL, status=StatusAssento.DISPONIVEL))
            db_seed.commit()
    db_seed.close()
    print("🚀 Servidor Kinoplex ON: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)