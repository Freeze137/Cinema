import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Film, Ticket, Clock, Search, User, Play, Compass, Star, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

// --- TIPAGENS ---
interface Sessao {
  id: number;
  horario: string;
  sala: string;
  preco: number;
}

interface Filme {
  id: number;
  titulo: string;
  sinopse: string;
  duracao?: string;
  genero?: string;
  classificacao?: string;
  sessoes: Sessao[];
}

export function Home() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [activeDate, setActiveDate] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFilmes() {
      try {
        const response = await api.get('/api/filmes');
        setFilmes(response.data);
      } catch (error) {
        console.error('Erro ao buscar os filmes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFilmes();
  }, []);

  const featuredMovie = filmes.length > 0 ? filmes[0] : null;
  const dates = ['HOJE 15', 'DOM 16', 'SEG 17', 'TER 18', 'QUA 19'];

  // Placeholders para imagens já que a API não fornece image_url atualmente
  const heroBg = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80";
  const getPoster = (id: number) => `https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80&sig=${id}`;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-24 hidden md:flex flex-col items-center py-8 border-r border-zinc-800/50 bg-zinc-950/50 backdrop-blur-2xl z-50">
        <div className="bg-red-600/10 p-3 rounded-2xl mb-12 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
          <Film className="w-8 h-8 text-red-600" />
        </div>
        <nav className="flex flex-col gap-8 w-full items-center">
          <button className="p-3 text-red-500 bg-red-600/10 rounded-xl relative group">
            <div className="absolute inset-y-0 -left-6 w-1 bg-red-600 rounded-r-full"></div>
            <Compass className="w-6 h-6" />
          </button>
          <button onClick={() => alert('Minhas Reservas: Em desenvolvimento!')} className="p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-xl transition-all group">
            <Ticket className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={() => alert('Calendário: Em desenvolvimento!')} className="p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-xl transition-all group">
            <CalendarIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        
        {/* HEADER */}
        <header className="absolute top-0 left-0 right-0 z-40 p-8 flex justify-between items-center bg-gradient-to-b from-zinc-950/80 to-transparent pointer-events-none">
          <div className="flex-1"></div>
          <div className="flex items-center gap-6 pointer-events-auto">
            <button onClick={() => alert('Busca: Em desenvolvimento!')} className="text-zinc-400 hover:text-white transition-colors group">
              <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div onClick={() => !user && navigate('/login')} className="flex items-center gap-3 bg-zinc-900/40 border border-white/5 backdrop-blur-xl py-2 px-4 rounded-full cursor-pointer hover:bg-zinc-800/60 transition-all group shadow-lg">
              <div className="w-8 h-8 bg-zinc-800/50 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition-colors" />
              </div>
              <span className="text-sm font-semibold tracking-wide pr-2">{user ? user.nome : 'Entrar'}</span>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative w-full h-[60vh] min-h-[500px] shrink-0 flex items-end pb-12 px-10 xl:px-20 pt-32">
          <div className="absolute inset-0 z-0">
            <img src={heroBg} alt="Background" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent"></div>
          </div>

          {loading ? (
             <div className="relative z-10 w-full max-w-2xl animate-pulse">
               <div className="w-32 h-8 bg-zinc-800/50 rounded-full mb-6"></div>
               <div className="w-3/4 h-16 bg-zinc-800/50 rounded-xl mb-4"></div>
               <div className="w-full h-24 bg-zinc-800/50 rounded-xl"></div>
             </div>
          ) : featuredMovie && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 max-w-3xl flex gap-8 items-end">
              <img src={getPoster(featuredMovie.id)} alt="Poster" className="w-56 h-80 object-cover rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] hidden md:block border border-white/5" />
              <div className="flex flex-col items-start">
                <span className="px-4 py-1.5 bg-red-600/20 text-red-500 border border-red-500/20 rounded-full text-xs font-bold tracking-[0.2em] mb-4">EM CARTAZ</span>
                <h1 className="text-6xl md:text-8xl font-black italic uppercase text-white tracking-tighter mb-4 leading-none drop-shadow-2xl">{featuredMovie.titulo}</h1>
                <div className="flex items-center gap-4 text-sm font-medium text-zinc-400 mb-6">
                  <span className="bg-zinc-800/80 px-3 py-1 rounded-md flex items-center gap-1.5 text-zinc-200">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {featuredMovie.classificacao || '14'}
                  </span>
                  <span>{featuredMovie.duracao || '120 min'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                  <span>{featuredMovie.genero || 'Ficção/Ação'}</span>
                </div>
                <p className="text-zinc-300 line-clamp-3 mb-8 text-lg max-w-2xl leading-relaxed">{featuredMovie.sinopse}</p>
                <div className="flex items-center gap-4">
                  <button className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold tracking-wide flex items-center gap-3 transition-all shadow-lg shadow-red-600/20">
                    <Ticket className="w-5 h-5" />
                    Comprar Ingresso
                  </button>
                  <button onClick={() => alert('Trailer indisponível no momento.')} className="bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white px-8 py-4 rounded-xl font-bold tracking-wide flex items-center gap-3 transition-all backdrop-blur-md group">
                  <Play className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                    Trailer
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* DATE SELECTOR */}
        <section className="px-10 xl:px-20 mt-12 mb-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {dates.map((date, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveDate(idx)}
                className={`shrink-0 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                  activeDate === idx 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'bg-zinc-900/50 text-zinc-400 border border-white/5 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        </section>

        {/* MOVIE GRID */}
        <section className="px-10 xl:px-20 pb-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-[2rem] h-[500px] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {filmes.map((filme) => (
                <motion.div 
                  variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                  key={filme.id} 
                  className="relative flex flex-col bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-red-500/30 transition-all duration-500 shadow-xl"
                >
                  <div className="relative h-[380px] w-full overflow-hidden">
                    <img src={getPoster(filme.id)} alt={filme.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
                    
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full flex flex-col">
                      <h2 className="text-3xl font-black italic text-white mb-2 leading-tight uppercase drop-shadow-md">{filme.titulo}</h2>
                      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300">
                        <span className="bg-red-600 px-2 py-0.5 rounded shadow-sm flex items-center gap-1"><Star className="w-3 h-3 fill-white" /> {filme.classificacao || '14'}</span>
                        <span className="opacity-70">{filme.genero || 'Ação'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-2 bg-zinc-950/50 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sessões</span>
                    </div>
                    {filme.sessoes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filme.sessoes.map((sessao) => (
                          <button
                            key={sessao.id}
                            onClick={() => navigate(`/sessao/${sessao.id}`)}
                            className="flex flex-col items-start px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 hover:border-red-500 rounded-xl transition-all shadow-sm group/btn"
                          >
                            <span className="text-sm font-bold tracking-wider transition-colors">{sessao.horario}</span>
                            <span className="text-[10px] font-medium uppercase opacity-80">{sessao.sala}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-sm font-medium italic">Nenhuma sessão disponível.</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}