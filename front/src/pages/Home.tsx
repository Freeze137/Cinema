import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Film, Ticket, Clock } from 'lucide-react';
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
  sessoes: Sessao[];
}

export function Home() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 overflow-hidden font-sans">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-20 text-center mt-12 flex flex-col items-center relative z-10"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-4 mb-4 cursor-default">
          <Film className="w-14 h-14 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
          <h1 className="text-6xl font-extrabold text-white tracking-tighter">
            Kino<span className="text-red-600">plex</span>
          </h1>
        </motion.div>
        <p className="text-zinc-400 text-lg font-medium tracking-wide">A experiência premium do cinema direto na sua tela.</p>
      </motion.header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl h-[450px] animate-pulse overflow-hidden flex flex-col">
              <div className="h-48 bg-zinc-800/30 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 to-transparent"></div>
              </div>
              <div className="p-8 flex flex-col gap-5 flex-1">
                <div className="h-8 bg-zinc-800/40 rounded-lg w-3/4"></div>
                <div className="h-4 bg-zinc-800/30 rounded-md w-full mt-2"></div>
                <div className="h-4 bg-zinc-800/30 rounded-md w-5/6"></div>
                <div className="mt-auto h-10 bg-zinc-800/30 rounded-xl w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 max-w-7xl mx-auto relative z-10"
        >
          {filmes.map((filme) => (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}
              key={filme.id} 
              className="bg-zinc-900 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(220,38,38,0.1)] hover:scale-[1.03] hover:border-red-600/30 transition-all duration-300 flex flex-col group relative"
            >
              {/* Efeito de Gradiente/Poster Mock */}
              <div className="h-56 bg-gradient-to-br from-zinc-800 to-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800/50">
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <Film className="w-20 h-20 text-zinc-700/50 group-hover:text-red-600/20 group-hover:scale-125 transition-all duration-500 z-0 absolute" />
                <h2 className="z-20 text-4xl font-black text-white/5 uppercase tracking-[0.2em] text-center px-4 mix-blend-overlay rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">{filme.titulo}</h2>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent z-20"></div>
              </div>

              <div className="p-8 pt-4 flex-1 flex flex-col relative z-30">
                <h2 className="text-3xl font-extrabold text-zinc-100 mb-3 leading-tight group-hover:text-red-500 transition-colors duration-300">{filme.titulo}</h2>
                <p className="text-zinc-400 font-medium text-sm mb-8 line-clamp-3 flex-1 leading-relaxed">{filme.sinopse}</p>
                
                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-5">
                    <Ticket className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sessões Disponíveis</h3>
                  </div>
                  {filme.sessoes.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {filme.sessoes.map((sessao) => (
                        <button
                          key={sessao.id}
                          onClick={() => navigate(`/sessao/${sessao.id}`)}
                          className="relative flex items-center gap-2 px-5 py-3 bg-zinc-950 text-zinc-300 hover:text-white rounded-xl text-sm font-bold transition-all duration-300 border border-zinc-800 hover:border-red-500 overflow-hidden shadow-md group/btn"
                        >
                          {/* Glow effect hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-600/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          <Clock className="w-4 h-4 text-zinc-500 group-hover/btn:text-red-400 transition-colors" />
                          <span className="relative z-10 tracking-wide">{sessao.horario}</span>
                          <span className="relative z-10 text-[10px] font-medium opacity-50 bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 border border-zinc-700">{sessao.sala}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-sm font-medium italic bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">Nenhuma sessão disponível hoje.</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}