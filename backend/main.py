from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

# 1. Configuração do Banco de Dados
SQLALCHEMY_DATABASE_URL = "sqlite:///./kinoplex.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Modelos das Tabelas
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
    cinema = Column(String)
    sala = Column(String)
    horario = Column(String)
    preco = Column(Float)

class ReservaDB(Base):
    __tablename__ = "reservas"
    id = Column(Integer, primary_key=True, index=True)
    sessao_id = Column(Integer, ForeignKey("sessoes.id"), index=True)
    assento = Column(String)

# Cria as tabelas
Base.metadata.create_all(bind=engine)

# 3. Inicialização do FastAPI
app = FastAPI(title="API Novo Kinoplex")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SCRIPT DE POPULAÇÃO (SEED) ---
# Adiciona dados iniciais se o banco estiver vazio
db = SessionLocal()
if db.query(FilmeDB).count() == 0:
    f1 = FilmeDB(titulo="Duna: Parte Dois", sinopse="A jornada mítica de Paul Atreides.", duracao="166 min", genero="Ficção", classificacao="8.5")
    f2 = FilmeDB(titulo="Kung Fu Panda 4", sinopse="Po é escolhido para se tornar o Líder Espiritual.", duracao="94 min", genero="Animação", classificacao="7.5")
    db.add_all([f1, f2])
    db.commit()
    
    s1 = SessaoDB(filme_id=f1.id, cinema="Kinoplex RioSul", sala="Sala 1", horario="20:00", preco=35.0)
    s2 = SessaoDB(filme_id=f2.id, cinema="Kinoplex RioSul", sala="Sala 2", horario="18:30", preco=25.0)
    db.add_all([s1, s2])
    db.commit()
db.close()

# 4. Rotas da API
@app.get("/api/filmes")
async def listar_filmes(db: Session = Depends(get_db)):
    filmes = db.query(FilmeDB).all()
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
            "sessoes": [{"id": s.id, "horario": s.horario, "sala": s.sala, "preco": s.preco} for s in sessoes]
        })
    return resultado

@app.get("/api/sessao/{sessao_id}")
async def obter_sessao(sessao_id: int, db: Session = Depends(get_db)):
    sessao = db.query(SessaoDB).filter(SessaoDB.id == sessao_id).first()
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    filme = db.query(FilmeDB).filter(FilmeDB.id == sessao.filme_id).first()
    reservas = db.query(ReservaDB).filter(ReservaDB.sessao_id == sessao_id).all()
    
    return {
        "id_sessao": sessao.id,
        "filme": {
            "titulo": filme.titulo,
            "duracao": filme.duracao,
            "avaliacao": filme.classificacao,
            "genero": filme.genero,
            "sinopse": filme.sinopse
        },
        "detalhes": {
            "cinema": sessao.cinema,
            "sala": sessao.sala,
            "horario": sessao.horario,
            "preco_ingresso": sessao.preco,
            "taxa_conveniencia": 2.50
        },
        "assentos_ocupados": [r.assento for r in reservas]
    }

@app.post("/api/reservas")
async def criar_reserva(reserva: dict, db: Session = Depends(get_db)):
    sessao_id = reserva.get("sessao_id")
    assentos = reserva.get("assentos")
    for a in assentos:
        db.add(ReservaDB(sessao_id=sessao_id, assento=a))
    db.commit()
    return {"status": "sucesso", "mensagem": "Reserva confirmada!"}