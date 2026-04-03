import uuid
import uvicorn
import bcrypt  # Usando diretamente para evitar erros de compatibilidade
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt

# --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---
# Caminho fixo para garantir que o banco fique na pasta backend
SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/kinoplex.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. MODELOS DAS TABELAS (DATABASE MODELS) ---
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

class SessaoDB(Base):
    __tablename__ = "sessoes"
    id = Column(Integer, primary_key=True, index=True)
    filme_id = Column(Integer, ForeignKey("filmes.id"))
    cinema = Column(String); sala = Column(String); horario = Column(String); preco = Column(Float)
    assentos = relationship("AssentoDB", back_populates="sessao")
    reservas = relationship("ReservaDB", back_populates="sessao")

class AssentoDB(Base):
    __tablename__ = "assentos"
    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes.id"), index=True)
    codigo = Column(String); tipo = Column(String); status = Column(String)
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

# --- 3. UTILITÁRIOS E SEGURANÇA (BCRYPT DIRETO) ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)

SECRET_KEY = "minha_chave_super_secreta_kinoplex"
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

# --- 4. INICIALIZAÇÃO DA APP ---
app = FastAPI(title="API Novo Kinoplex")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": "Assento ocupado."})

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
        sessoes = db.query(SessaoDB).filter(SessaoDB.filme_id == f.id).all()
        resultado.append({
            "id": f.id, "titulo": f.titulo, "sinopse": f.sinopse,
            "sessoes": [{"id": s.id, "horario": s.horario, "sala": s.sala, "preco": s.preco} for s in sessoes]
        })
    return resultado

@app.post("/api/reservas")
async def criar_reserva(reserva: dict, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    sessao_id = reserva.get("sessao_id")
    codigos = reserva.get("assentos")
    assentos_db = db.query(AssentoDB).filter(AssentoDB.sessao_id == sessao_id, AssentoDB.codigo.in_(codigos)).all()
    
    for a in assentos_db:
        if a.status != "DISPONIVEL": raise HTTPException(status_code=400, detail=f"Assento {a.codigo} ocupado.")
        a.status = "OCUPADO"
        db.add(ReservaDB(sessao_id=sessao_id, assento_id=a.id, user_id=current_user.id, valor_pago=20.0))
    
    db.commit()
    return {"status": "sucesso", "reserva_id": str(uuid.uuid4())[:8].upper()}

# --- 6. STARTUP E SEED ---
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db_seed = SessionLocal()
    if db_seed.query(FilmeDB).count() == 0:
        print("🌱 Populando banco...")
        f1 = FilmeDB(titulo="Duna 2", sinopse="Épico no deserto.", duracao="166 min", genero="Ficção", classificacao="14")
        db_seed.add(f1)
        db_seed.commit()
        s1 = SessaoDB(filme_id=f1.id, cinema="Kinoplex RioSul", sala="01", horario="20:00", preco=35.0)
        db_seed.add(s1)
        db_seed.commit()
        for r in range(5):
            char = chr(65 + r)
            for s in range(1, 6):
                db_seed.add(AssentoDB(sessao_id=s1.id, codigo=f"{char}{s}", tipo="NORMAL", status="DISPONIVEL"))
        db_seed.commit()
    db_seed.close()
    
    print("🚀 Servidor Kinoplex ligado em http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)