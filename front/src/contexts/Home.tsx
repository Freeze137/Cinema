import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Film, Ticket, Clock, Search, Menu, X, ChevronRight, Star, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const posterGradients = [
  'from-violet-950 via-purple-900 to-zinc-900',
  'from-blue-950 via-cyan-900 to-zinc-900',
  'from-emerald-950 via-teal-900 to-zinc-900',
  'from-rose-950 via-pink-900 to-zinc-900',
  'from-orange-950 via-amber-900 to-zinc-900',
  'from-indigo-950 via-blue-900 to-zinc-900',
];

const mockRatings = [4.8, 4.5, 4.2, 3.9, 4.7, 4.1];

export function Home() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/filmes')
      .then(r => setFilmes(r.data))
      .catch(err => console.error('Erro ao buscar filmes:', err))
      .finally(() => setLoading(false));
  }, []);

  const featured = filmes[0] ?? null;
  const listaFilmes = searchQuery
    ? filmes.filter(f => f.titulo.toLowerCase().includes(searchQuery.toLowerCase()))
    : filmes;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          <div className="flex items-center gap-2 shrink-0 cursor-default select-none">
            <Film className="w-6 h-6 text-yellow-400" />
            <span className="text-xl font-extrabold tracking-tight">
              Kino<span className="text-yellow-400">plex</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#inicio" className="text-yellow-400 font-bold">Início</a>
            <a href="#filmes" className="text-zinc-400 hover:text-white transition-colors duration-200">Filmes</a>
            <a href="#filmes" className="text-zinc-400 hover:text-white transition-colors duration-200">Programação</a>
            <a href="#filmes" className="text-zinc-400 hover:text-white transition-colors duration-200">Preços</a>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.div
                  key="search-open"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 gap-2 overflow-hidden"
                >
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar filme..."
                    className="bg-transparent text-sm text-zinc-100 outline-none w-full placeholder:text-zinc-500"
                  />
                  <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                    <X className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-closed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={() => navigate('/login')}
              className="hidden md:flex items-center px-5 py-2 rounded-xl border border-yellow-400/60 text-yellow-400 text-sm font-bold hover:bg-yellow-400 hover:text-zinc-950 transition-all duration-200"
            >
              Entrar
            </button>

            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-zinc-800 bg-zinc-950"
            >
              <div className="px-6 py-5 flex flex-col gap-5 text-sm font-medium">
                <a href="#inicio" className="text-yellow-400 font-bold">Início</a>
                <a href="#filmes" className="text-zinc-400">Filmes</a>
                <a href="#filmes" className="text-zinc-400">Programação</a>
                <button onClick={() => navigate('/login')} className="text-left text-yellow-400 font-bold">
                  Entrar →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section id="inicio" className="pt-16">
        {loading ? (
          <div className="min-h-[85vh] flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
              <Film className="w-10 h-10 text-yellow-400" />
            </motion.div>
          </div>
        ) : featured ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative min-h-[85vh] flex items-center overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${posterGradients[0]} opacity-50`} />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <p className="text-yellow-400 text-xs font-black tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                  <span className="w-6 h-px bg-yellow-400 inline-block" />
                  Em Destaque
                </p>

                <h1 className="text-5xl xl:text-7xl font-black text-white leading-none tracking-tight mb-5">
                  {featured.titulo}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="bg-yellow-400 text-zinc-950 text-[11px] font-black px-2.5 py-1 rounded-md">HD</span>
                  <span className="text-zinc-400 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Cinema
                  </span>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
                    ))}
                    <span className="text-zinc-400 text-xs ml-1">4.8</span>
                  </div>
                </div>

                <p className="text-zinc-300 text-base leading-relaxed mb-10 max-w-lg line-clamp-4">
                  {featured.sinopse}
                </p>

                <div className="mb-3 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-yellow-400" />
                  <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                    Escolha sua sessão
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {featured.sessoes.slice(0, 4).map(s => (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/sessao/${s.id}`)}
                      className="flex items-center gap-2 px-5 py-3 bg-yellow-400 text-zinc-950 rounded-xl text-sm font-black hover:bg-yellow-300 transition-colors duration-200 shadow-lg shadow-yellow-400/25"
                    >
                      <Clock className="w-4 h-4" />
                      {s.horario}
                      <span className="text-[10px] opacity-60 bg-zinc-950/20 px-1.5 py-0.5 rounded">{s.sala}</span>
                    </motion.button>
                  ))}
                  {featured.sessoes.length === 0 && (
                    <p className="text-zinc-600 text-sm italic">Sem sessões disponíveis.</p>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="hidden lg:flex justify-center"
              >
                <div className={`w-64 xl:w-72 aspect-[2/3] rounded-2xl bg-gradient-to-br ${posterGradients[0]} border border-yellow-400/20 shadow-2xl shadow-yellow-400/10 relative overflow-hidden flex items-center justify-center`}>
                  <Film className="absolute w-28 h-28 text-white/5" />
                  <p className="relative z-10 text-3xl font-black text-white/8 uppercase tracking-widest text-center px-4 rotate-[-8deg] select-none">
                    {featured.titulo}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-zinc-950/90 to-transparent" />
                  <div className="absolute bottom-4 left-0 right-0 px-5 text-center">
                    <p className="text-yellow-400 text-[10px] font-black tracking-[0.25em] uppercase">Em Cartaz</p>
                    <p className="text-white text-sm font-bold mt-1 line-clamp-1">{featured.titulo}</p>
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div className="min-h-[40vh] flex items-center justify-center text-zinc-600">
            Nenhum filme disponível.
          </div>
        )}
      </section>

      {/* ── FILMES EM CARTAZ ── */}
      <section id="filmes" className="max-w-7xl mx-auto px-6 py-20">

        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-yellow-400 text-[11px] font-black tracking-[0.3em] uppercase mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-yellow-400 inline-block" />
              Programação
            </p>
            <h2 className="text-3xl font-extrabold text-white">Filmes em Cartaz</h2>
          </div>
          <button className="hidden md:flex items-center gap-1 text-sm text-zinc-500 hover:text-yellow-400 transition-colors font-medium">
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-zinc-900/50 border border-zinc-800/50 h-96 animate-pulse" />
            ))}
          </div>
        ) : listaFilmes.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            {searchQuery ? `Nenhum filme encontrado para "${searchQuery}".` : 'Nenhum filme disponível.'}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {listaFilmes.map((filme, idx) => {
              const gradient = posterGradients[idx % posterGradients.length];
              const rating = mockRatings[idx % mockRatings.length];
              return (
                <motion.div
                  key={filme.id}
                  variants={{
                    hidden: { opacity: 0, y: 28 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
                  }}
                  className="group bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-yellow-400/30 hover:shadow-2xl hover:shadow-yellow-400/5 transition-all duration-300 flex flex-col"
                >
                  <div className={`h-52 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}>
                    <Film className="absolute w-20 h-20 text-white/5 group-hover:scale-110 group-hover:text-white/8 transition-all duration-500" />
                    <p className="text-white/5 text-3xl font-black uppercase tracking-widest text-center px-4 rotate-[-5deg] select-none group-hover:rotate-0 transition-transform duration-500">
                      {filme.titulo}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-900 to-transparent" />

                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-zinc-950/70 backdrop-blur-sm px-2.5 py-1.5 rounded-xl">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-black text-yellow-400">{rating.toFixed(1)}</span>
                    </div>

                    <div className="absolute top-3 left-3 bg-yellow-400 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                      HD
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-extrabold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-300 line-clamp-1">
                      {filme.titulo}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-5 line-clamp-2 flex-1">
                      {filme.sinopse}
                    </p>

                    <div className="mt-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <Ticket className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          Sessões disponíveis
                        </span>
                      </div>

                      {filme.sessoes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {filme.sessoes.map(s => (
                            <button
                              key={s.id}
                              onClick={() => navigate(`/sessao/${s.id}`)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-yellow-400 text-zinc-300 hover:text-zinc-950 text-xs font-bold transition-all duration-200 border border-zinc-700/50 hover:border-yellow-400"
                            >
                              <Clock className="w-3 h-3" />
                              {s.horario}
                              <span className="opacity-50 text-[9px]">{s.sala}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-700 text-xs italic bg-zinc-800/50 px-3 py-2 rounded-xl border border-zinc-800">
                          Sem sessões disponíveis.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800/60 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2 font-bold text-zinc-500">
            <Film className="w-4 h-4 text-yellow-400/60" />
            Kino<span className="text-yellow-400/60">plex</span>
          </div>
          <p>© {new Date().getFullYear()} Kinoplekis. Projeto pessoal.</p>
        </div>
      </footer>

    </div>
  );
}