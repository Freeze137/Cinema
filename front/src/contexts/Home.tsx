import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Film, Ticket, Search, User, Play, Star, Clock, ChevronLeft, ChevronRight, Tv, Clapperboard, Tag, BookOpen, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [activeFilter, setActiveFilter] = useState('Em Cartaz');
  const { user } = useContext(AuthContext);
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
  const filters = ['Em Cartaz', 'Séries', 'Anime'];

  const heroBg = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80";
  const getPoster = (id: number) => `https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80&sig=${id}`;
  const getBackdrop = (id: number) => `https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=900&q=80&sig=${id + 10}`;

  const navLinks = [
    { label: 'Início', active: true },
    { label: 'Filmes', active: false },
    { label: 'Séries', active: false },
    { label: 'Preços', active: false },
    { label: 'Blog', active: false },
    { label: 'Contato', active: false },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f13] text-zinc-100 font-sans">

      {/* ── TOP BAR ── */}
      <div className="bg-[#0a0a0e] border-b border-white/5 px-8 py-1.5 hidden md:flex justify-between items-center text-[11px] text-zinc-500">
        <span>Kinoplex — Assista 1 mês <span className="text-orange-400 font-semibold">Grátis</span></span>
        <div className="flex items-center gap-6">
          <span>Sobre nós</span>
          <span>FAQ</span>
          <div className="flex gap-3">
            {['f','t','i','y'].map(s => (
              <span key={s} className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold uppercase cursor-pointer hover:bg-orange-500 transition-colors">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#0f0f13]/95 backdrop-blur-md border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-widest text-white uppercase">Kinoplex</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <button
                key={link.label}
                className={`text-sm font-semibold tracking-wide transition-colors relative pb-0.5 ${
                  link.active
                    ? 'text-orange-400'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {link.label}
                {link.active && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-400 rounded-full"></span>}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar filme..."
                className="bg-zinc-800/60 border border-white/5 rounded-full pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 w-44 transition-all focus:w-56"
              />
            </div>
            <div
              onClick={() => !user && navigate('/login')}
              className="flex items-center gap-2 border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-5 py-2 rounded-full text-sm font-bold tracking-wide cursor-pointer transition-all"
            >
              <User className="w-4 h-4" />
              {user ? user.nome : 'Entrar'}
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden">
        {/* BG */}
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Hero background" className="w-full h-full object-cover opacity-20" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f13] via-[#0f0f13]/80 to-[#0f0f13]/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20">
          {/* Text side */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-24 bg-zinc-800 rounded"></div>
              <div className="h-16 w-3/4 bg-zinc-800 rounded-xl"></div>
              <div className="h-24 w-full bg-zinc-800 rounded-xl"></div>
            </div>
          ) : featuredMovie && (
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <p className="text-orange-400 text-sm font-black uppercase tracking-[0.2em] mb-3">Kinoplex</p>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
                Filmes <span className="text-orange-400">{featuredMovie.titulo}</span>, Séries <br />e muito mais.
              </h1>

              {/* Meta badges */}
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded">PG</span>
                <span className="bg-zinc-700 text-zinc-200 text-[10px] font-black px-2 py-0.5 rounded">4K</span>
                <span className="text-zinc-400 text-xs">{featuredMovie.genero || 'Ação, Drama'}</span>
                <span className="text-zinc-600 text-xs">•</span>
                <span className="text-zinc-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{featuredMovie.duracao || '128 min'}</span>
              </div>

              <p className="text-zinc-400 text-base leading-relaxed max-w-lg mb-8 line-clamp-3">{featuredMovie.sinopse}</p>

              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5">
                  <Play className="w-4 h-4 fill-white" />
                  Assistir Agora
                </button>
                {featuredMovie.sessoes?.length > 0 && (
                  <button
                    onClick={() => navigate(`/sessao/${featuredMovie.sessoes[0].id}`)}
                    className="flex items-center gap-2 border border-zinc-700 hover:border-orange-500/50 text-zinc-300 hover:text-white px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5"
                  >
                    <Ticket className="w-4 h-4" />
                    Comprar Ingresso
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Poster side */}
          {!loading && featuredMovie && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:flex justify-center"
            >
              <div className="relative">
                <div className="w-72 h-96 rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-2xl shadow-orange-500/10">
                  <img
                    src={getBackdrop(featuredMovie.id)}
                    alt={featuredMovie.titulo}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-6 bg-[#1a1a22] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                    <span className="text-white font-black text-sm">8.4</span>
                    <span className="text-zinc-500 text-xs">/ 10</span>
                  </div>
                  <p className="text-zinc-400 text-[10px] mt-0.5">Avaliação dos usuários</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── FILMES EM CARTAZ ── */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">Online Streaming</p>
            <h2 className="text-2xl font-black text-white">Filmes em Cartaz</h2>
            <div className="w-10 h-0.5 bg-orange-500 mt-2 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                  activeFilter === f
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {f}
              </button>
            ))}
            <button className="w-7 h-7 rounded-full bg-zinc-800/60 border border-white/5 flex items-center justify-center hover:bg-zinc-700 transition-colors">
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <button className="w-7 h-7 rounded-full bg-zinc-800/60 border border-white/5 flex items-center justify-center hover:bg-zinc-700 transition-colors">
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Movie cards row */}
        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="shrink-0 w-44 h-64 bg-zinc-900/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
          >
            {filmes.map((filme) => (
              <motion.div
                key={filme.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="shrink-0 w-44 group cursor-pointer"
              >
                {/* Poster */}
                <div className="relative w-44 h-64 rounded-xl overflow-hidden mb-3 shadow-lg">
                  <img
                    src={getPoster(filme.id)}
                    alt={filme.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    {filme.sessoes?.length > 0 && (
                      <button
                        onClick={() => navigate(`/sessao/${filme.sessoes[0].id}`)}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors"
                      >
                        Ver Sessões
                      </button>
                    )}
                  </div>
                  {/* Rating badge */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span className="text-white text-[10px] font-black">8.{(filme.id % 9) + 1}</span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-white text-sm font-bold truncate mb-1">{filme.titulo}</h3>
                <p className="text-zinc-500 text-xs font-medium">{filme.genero || 'Aventura'}</p>

                {/* Meta row */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-zinc-800 text-zinc-400 text-[9px] font-black px-1.5 py-0.5 rounded">4K</span>
                  <span className="text-zinc-600 text-[10px]">Português</span>
                  <span className="ml-auto text-orange-400 text-[10px] font-black flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-orange-400" />
                    {(3 + (filme.id % 3)).toFixed(1)}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── EM BREVE ── */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">Online Streaming</p>
            <h2 className="text-2xl font-black text-white">Em Breve</h2>
            <div className="w-10 h-0.5 bg-orange-500 mt-2 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
            {['Séries', 'Filmes', 'Anime'].map(f => (
              <button key={f} className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-zinc-200 transition-all">
                {f}
              </button>
            ))}
            <button className="w-7 h-7 rounded-full bg-zinc-800/60 border border-white/5 flex items-center justify-center hover:bg-zinc-700 transition-colors">
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <button className="w-7 h-7 rounded-full bg-zinc-800/60 border border-white/5 flex items-center justify-center hover:bg-zinc-700 transition-colors">
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-2 md:grid-cols-4 gap-5"
          >
            {filmes.slice(0, 4).map((filme) => (
              <motion.div
                key={filme.id}
                variants={{ hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } }}
                className="relative rounded-xl overflow-hidden group cursor-pointer shadow-lg"
                style={{ aspectRatio: '3/2' }}
                onClick={() => filme.sessoes?.length > 0 && navigate(`/sessao/${filme.sessoes[0].id}`)}
              >
                <img
                  src={getBackdrop(filme.id + 5)}
                  alt={filme.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white text-sm font-black truncate mb-1">{filme.titulo}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800/80 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded">4K</span>
                    <span className="text-zinc-400 text-[10px] flex items-center gap-1"><Clock className="w-3 h-3" />{filme.duracao || '128 min'}</span>
                    <span className="ml-auto text-orange-400 text-[10px] font-black flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-orange-400" />
                      {(3.0 + (filme.id % 30) / 10).toFixed(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── BANNER PROMO ── */}
      <section className="max-w-7xl mx-auto px-8 pb-20">
        <div className="bg-[#1a1a22] border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
          {/* Icon card */}
          <div className="shrink-0 w-36 h-44 bg-zinc-900 border border-orange-500/30 rounded-xl flex flex-col items-center justify-center gap-3 shadow-xl shadow-orange-500/10 relative z-10">
            <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Tv className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-white text-xs font-black text-center px-2">Apenas R$ 9,99 / mês</p>
            <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full">4K HD</span>
          </div>
          <div className="relative z-10">
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Nossos Serviços</p>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Baixe seus filmes e <br />assista offline.</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: <Tv className="w-5 h-5 text-orange-400" />, title: 'Na sua TV', desc: 'Assista em qualquer smart TV, Apple TV, Chromecast e mais.' },
                { icon: <Play className="w-5 h-5 text-orange-400" />, title: 'Em qualquer lugar', desc: 'Assista no celular, tablet, notebook ou computador.' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-white text-sm font-bold mb-1">{item.title}</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}