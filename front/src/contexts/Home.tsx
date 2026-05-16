import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Film, Ticket, Search, User, Play, Star, Clock, ChevronLeft, ChevronRight, Tv, Calendar } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface Sessao { id: number; horario: string; sala: string; preco: number; }
interface Filme { id: number; titulo: string; sinopse: string; duracao?: string; genero?: string; classificacao?: string; sessoes: Sessao[]; }
interface Reserva { id: number; assento: string; sessao_id: number; }

type ModalType = 'reservas' | 'calendario' | null;

export function Home() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Em Cartaz');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/api/filmes');
        setFilmes(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeModal === 'reservas' && user) {
      api.get('/api/reservas').then(r => setReservas(r.data)).catch(() => setReservas([]));
    }
  }, [activeModal, user]);

  const featuredMovie = filmes.length > 0 ? filmes[0] : null;
  const filters = ['Em Cartaz', 'Séries', 'Anime'];
  const filteredFilmes = filmes.filter(f =>
    f.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.genero?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const heroBg = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80";
  const getPoster = (id: number) => `https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80&sig=${id}`;
  const getBackdrop = (id: number) => `https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=900&q=80&sig=${id + 10}`;

  const navLinks = ['Início','Filmes','Séries','Preços','Blog','Contato'];

  // Gera próximos 30 dias para o calendário
  const today = new Date();
  const calDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    d.setDate(d.getDate() + i - d.getDay());
    return d;
  });
  const monthName = today.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: "tween" } },
  };
  const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] text-zinc-100 font-sans">

      {/* TOP BAR */}
      <div className="bg-[#0a0a0e] border-b border-white/5 px-8 py-1.5 hidden md:flex justify-between items-center text-[11px] text-zinc-500">
        <span>Kinoplex — Assista 1 mês <span className="text-orange-400 font-semibold">Grátis</span></span>
        <div className="flex items-center gap-6">
          <span className="hover:text-zinc-300 cursor-pointer transition-colors">Sobre nós</span>
          <span className="hover:text-zinc-300 cursor-pointer transition-colors">FAQ</span>
          <div className="flex gap-2">
            {['f','t','i','y'].map(s => (
              <span key={s} className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold uppercase cursor-pointer hover:bg-orange-500 transition-colors">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0f0f13]/95 backdrop-blur-md border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-widest text-white uppercase">Kinoplex</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((label, i) => (
              <button key={label} className={`text-sm font-semibold tracking-wide transition-colors relative pb-0.5 ${i === 0 ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-100'}`}>
                {label}
                {i === 0 && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar filme..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-zinc-800/60 border border-white/5 rounded-full pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 w-44 transition-all focus:w-56"
              />
            </div>
            {/* BOTÃO CALENDÁRIO */}
            <button onClick={() => setActiveModal('calendario')} className="p-2 text-zinc-400 hover:text-orange-400 transition-colors">
              <Calendar className="w-5 h-5" />
            </button>
            {/* BOTÃO RESERVAS */}
            <button onClick={() => user ? setActiveModal('reservas') : navigate('/login')} className="p-2 text-zinc-400 hover:text-orange-400 transition-colors">
              <Ticket className="w-5 h-5" />
            </button>
            <div onClick={() => !user && navigate('/login')} className="flex items-center gap-2 border border-orange-500/70 text-orange-400 hover:bg-orange-500 hover:text-white px-5 py-2 rounded-full text-sm font-bold tracking-wide cursor-pointer transition-all">
              <User className="w-4 h-4" />
              {user ? user.nome : 'Entrar'}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Hero" className="w-full h-full object-cover opacity-20" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f13] via-[#0f0f13]/80 to-[#0f0f13]/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-transparent to-transparent"></div>
          {/* gradiente laranja sutil no fundo */}
          <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-24 bg-zinc-800 rounded"></div>
              <div className="h-16 w-3/4 bg-zinc-800 rounded-xl"></div>
              <div className="h-24 w-full bg-zinc-800 rounded-xl"></div>
            </div>
          ) : featuredMovie && (
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.p variants={fadeUp} className="text-orange-400 text-sm font-black uppercase tracking-[0.2em] mb-3">Kinoplex</motion.p>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
                Filmes <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">{featuredMovie.titulo}</span>,<br/>Séries e muito mais.
              </motion.h1>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded">PG</span>
                <span className="bg-zinc-700 text-zinc-200 text-[10px] font-black px-2 py-0.5 rounded">4K</span>
                <span className="text-zinc-400 text-xs">{featuredMovie.genero || 'Ação, Drama'}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{featuredMovie.duracao || '128 min'}</span>
              </motion.div>
              <motion.p variants={fadeUp} className="text-zinc-400 text-base leading-relaxed max-w-lg mb-8 line-clamp-3">{featuredMovie.sinopse}</motion.p>
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                <button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5">
                  <Play className="w-4 h-4 fill-white" />Assistir Agora
                </button>
                {featuredMovie.sessoes?.length > 0 && (
                  <button onClick={() => navigate(`/sessao/${featuredMovie.sessoes[0].id}`)} className="flex items-center gap-2 border border-zinc-700 hover:border-orange-500/50 text-zinc-300 hover:text-white px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5">
                    <Ticket className="w-4 h-4" />Comprar Ingresso
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
          {!loading && featuredMovie && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-96 rounded-2xl overflow-hidden border-2 border-orange-500/30 shadow-2xl shadow-orange-500/10">
                  <img src={getBackdrop(featuredMovie.id)} alt={featuredMovie.titulo} className="w-full h-full object-cover" loading="lazy" />
                </div>
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

      {/* FILMES EM CARTAZ */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="flex items-center justify-between mb-8">
          <div>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">Online Streaming</p>
            <h2 className="text-2xl font-black text-white">Filmes em Cartaz</h2>
            <div className="w-10 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 mt-2 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
            {filters.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${activeFilter === f ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-zinc-200'}`}>{f}</button>
            ))}
            <button className="w-7 h-7 rounded-full bg-zinc-800/60 border border-white/5 flex items-center justify-center hover:bg-zinc-700 transition-colors"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
            <button className="w-7 h-7 rounded-full bg-zinc-800/60 border border-white/5 flex items-center justify-center hover:bg-zinc-700 transition-colors"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-4">{[1,2,3,4,5].map(i => <div key={i} className="shrink-0 w-44 h-64 bg-zinc-900/50 rounded-xl animate-pulse"></div>)}</div>
        ) : (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
            {filteredFilmes.map(filme => (
              <motion.div key={filme.id} variants={fadeUp} className="shrink-0 w-44 group cursor-pointer">
                <div className="relative w-44 h-64 rounded-xl overflow-hidden mb-3 shadow-lg">
                  <img src={getPoster(filme.id)} alt={filme.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    {filme.sessoes?.length > 0 && (
                      <button onClick={() => navigate(`/sessao/${filme.sessoes[0].id}`)} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors">Ver Sessões</button>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span className="text-white text-[10px] font-black">8.{(filme.id % 9)+1}</span>
                  </div>
                </div>
                <h3 className="text-white text-sm font-bold truncate mb-1">{filme.titulo}</h3>
                <p className="text-zinc-500 text-xs font-medium">{filme.genero || 'Aventura'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-zinc-800 text-zinc-400 text-[9px] font-black px-1.5 py-0.5 rounded">4K</span>
                  <span className="text-zinc-600 text-[10px]">Português</span>
                  <span className="ml-auto text-orange-400 text-[10px] font-black flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-orange-400" />{(3+(filme.id%3)).toFixed(1)}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* EM BREVE */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="flex items-center justify-between mb-8">
          <div>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">Online Streaming</p>
            <h2 className="text-2xl font-black text-white">Em Breve</h2>
            <div className="w-10 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 mt-2 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
            {['Séries','Filmes','Anime'].map(f => (
              <button key={f} className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-zinc-200 transition-all">{f}</button>
            ))}
          </div>
        </motion.div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{[1,2,3,4].map(i => <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse"></div>)}</div>
        ) : (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {filmes.slice(0,4).map(filme => (
              <motion.div key={filme.id} variants={fadeUp} className="relative rounded-xl overflow-hidden group cursor-pointer shadow-lg" style={{ aspectRatio:'3/2' }} onClick={() => filme.sessoes?.length > 0 && navigate(`/sessao/${filme.sessoes[0].id}`)}>
                <img src={getBackdrop(filme.id+5)} alt={filme.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white text-sm font-black truncate mb-1">{filme.titulo}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800/80 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded">4K</span>
                    <span className="text-zinc-400 text-[10px] flex items-center gap-1"><Clock className="w-3 h-3" />{filme.duracao||'128 min'}</span>
                    <span className="ml-auto text-orange-400 text-[10px] font-black flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-orange-400" />{(3.0+(filme.id%30)/10).toFixed(1)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* BANNER PROMO */}
      <motion.section initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="max-w-7xl mx-auto px-8 pb-20">
        <div className="bg-gradient-to-r from-[#1a1a22] via-[#1e1a22] to-[#1a1a22] border border-orange-500/10 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
          <div className="shrink-0 w-36 h-44 bg-zinc-900 border border-orange-500/30 rounded-xl flex flex-col items-center justify-center gap-3 shadow-xl shadow-orange-500/10 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full flex items-center justify-center">
              <Tv className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-white text-xs font-black text-center px-2">Apenas R$ 9,99 / mês</p>
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full">4K HD</span>
          </div>
          <div className="relative z-10">
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Nossos Serviços</p>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Baixe seus filmes e<br/>assista offline.</h3>
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
      </motion.section>

      {/* ===== MODAIS ===== */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ duration: 0.35, type: "tween" }}
              className="bg-[#16161e] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/50"
              onClick={e => e.stopPropagation()}
            >
              {/* MODAL MINHAS RESERVAS */}
              {activeModal === 'reservas' && (
                <>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Minha Conta</p>
                      <h2 className="text-xl font-black text-white">Minhas Reservas</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white transition-colors text-2xl font-light">×</button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {!user ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-4">Faça login para ver suas reservas</p>
                        <button onClick={() => { setActiveModal(null); navigate('/login'); }} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm">Fazer Login</button>
                      </div>
                    ) : reservas.length === 0 ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2">Nenhuma reserva encontrada</p>
                        <p className="text-zinc-600 text-sm">Compre ingressos para ver aqui</p>
                      </div>
                    ) : (
                      <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-3">
                        {reservas.map((r, i) => (
                          <motion.div key={r.id} variants={fadeUp} className="flex items-center gap-4 bg-zinc-800/40 border border-white/5 rounded-xl p-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg flex items-center justify-center shrink-0">
                              <Ticket className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold text-sm">Reserva #{r.id}</p>
                              <p className="text-zinc-500 text-xs mt-0.5">Assento <span className="text-orange-400 font-bold">{r.assento}</span> • Sessão #{r.sessao_id}</p>
                            </div>
                            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Confirmado</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {/* MODAL CALENDÁRIO */}
              {activeModal === 'calendario' && (
                <>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">Programação</p>
                      <h2 className="text-xl font-black text-white capitalize">{monthName}</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white transition-colors text-2xl font-light">×</button>
                  </div>
                  <div className="p-6">
                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 mb-2">
                      {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-wider py-2">{d}</div>
                      ))}
                    </div>
                    {/* Grade de dias */}
                    <div className="grid grid-cols-7 gap-1">
                      {calDays.map((d, i) => {
                        const isToday = d.toDateString() === today.toDateString();
                        const isCurMonth = d.getMonth() === today.getMonth();
                        const hasSessao = filmes.some(f => f.sessoes?.length > 0) && isCurMonth && d >= today && Math.random() > 0.5;
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.01 }}
                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                              isToday ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' :
                              isCurMonth ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' :
                              'text-zinc-700'
                            }`}
                          >
                            {d.getDate()}
                            {hasSessao && !isToday && (
                              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-500"></span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Sessões do dia */}
                    <div className="mt-6 border-t border-white/5 pt-5">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">Sessões de Hoje</p>
                      {loading ? (
                        <div className="animate-pulse space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-zinc-800/50 rounded-xl"></div>)}</div>
                      ) : filmes.flatMap(f => f.sessoes?.map(s => ({ ...s, filme: f })) || []).length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">Sem sessões para hoje</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                          {filmes.flatMap(f => (f.sessoes||[]).map(s => ({ ...s, filme: f }))).map((s, i) => (
                            <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.05 }}
                              className="flex items-center gap-3 bg-zinc-800/40 border border-white/5 rounded-xl p-3 hover:border-orange-500/20 transition-colors cursor-pointer group"
                              onClick={() => { navigate(`/sessao/${s.id}`); setActiveModal(null); }}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg flex items-center justify-center shrink-0">
                                <Film className="w-4 h-4 text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-bold truncate">{s.filme.titulo}</p>
                                <p className="text-zinc-500 text-xs">Sala {s.sala} • {s.horario}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-orange-400 font-black text-sm">R$ {s.preco?.toFixed(2)}</p>
                                <p className="text-zinc-600 text-[10px] group-hover:text-orange-400 transition-colors">Comprar →</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}