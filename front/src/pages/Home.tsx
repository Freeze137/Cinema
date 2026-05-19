import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Film, Ticket, Clock, Search, User, Play, Compass, Star, Calendar as CalendarIcon, CheckCircle, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface Sessao {
  id: number;
  data: string;
  horario: string;
  sala: string;
  tipo_sala: string;
  preco_base: number;
}

interface Filme {
  id: number;
  titulo: string;
  sinopse: string;
  duracao?: string;
  genero?: string;
  classificacao?: string;
  lote?: number;
  sessoes: Sessao[];
}

interface Reserva {
  id: number;
  filme: string;
  data: string;
  horario: string;
  sala: string;
  assento: string;
  data_reserva: string;
  ingressos: Array<{ tipo: string; valor: number }>;
}

type ModalType = 'reservas' | 'calendario' | null;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, type: 'tween' } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, type: 'tween' } },
};

export function Home() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCalDay, setSelectedCalDay] = useState<number>(new Date().getDate());
  const [sessionesCalendarData, setSessionesCalendarData] = useState<Record<number, any[]>>({});
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFilmes() {
      setLoading(true);
      try {
        const isToday = activeDate.toDateString() === new Date().toDateString();
        // Se for hoje, usa o endpoint com a regra de rotação de 12h. Se não, busca os do dia selecionado.
        const endpoint = isToday ? '/api/filmes' : `/api/filmes/cartaz/${activeDate.toISOString().split('T')[0]}`;
        const response = await api.get(endpoint);
        setFilmes(response.data);
      } catch (error) {
        console.error('Erro ao buscar filmes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFilmes();
  }, [activeDate]);

  useEffect(() => {
    if (activeModal === 'reservas' && user) {
      api.get('/api/minhas-reservas')
        .then(r => setReservas(r.data))
        .catch(() => setReservas([]));
    }
  }, [activeModal, user]);

  useEffect(() => {
    if (activeModal === 'calendario') {
      async function fetchCalendarData() {
        try {
          const hoje = new Date();
          const response = await api.get(
            `/api/calendario/${hoje.getFullYear()}/${hoje.getMonth() + 1}`
          );
          setSessionesCalendarData(response.data.dias_com_sessoes || {});
        } catch (error) {
          console.error('Erro ao buscar dados do calendário:', error);
        }
      }
      fetchCalendarData();
    }
  }, [activeModal]);

  const featuredMovie = filmes.length > 0 ? filmes[0] : null;

  const heroBg = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80";
  const getPoster = (id: number) => `https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=400&q=80&sig=${id}`;

  // Calendário
  const today = new Date();
  const monthName = today.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calCells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  function getSessionsForDay(day: number) {
    return sessionesCalendarData[day] || [];
  }

  return (
    <div className="flex h-screen bg-[#0f0f13] text-zinc-100 font-sans overflow-hidden" style={{ overflowX: "hidden" }}>

      {/* SIDEBAR */}
      <aside className="w-24 hidden md:flex flex-col items-center py-8 border-r border-white/5 bg-[#0a0a0e]/80 backdrop-blur-2xl z-50">
        <div className="bg-orange-500/10 p-3 rounded-2xl mb-12 shadow-[0_0_20px_rgba(249,115,22,0.25)]">
          <Film className="w-8 h-8 text-orange-400" />
        </div>
        <nav className="flex flex-col gap-8 w-full items-center">
          {/* Início */}
          <button className="p-3 text-orange-400 bg-orange-500/10 rounded-xl relative group">
            <div className="absolute inset-y-0 -left-6 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full"></div>
            <Compass className="w-6 h-6" />
          </button>
          {/* Minhas Reservas */}
          <button
            onClick={() => user ? setActiveModal('reservas') : navigate('/login')}
            className="p-3 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all group"
          >
            <Ticket className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          {/* Calendário */}
          <button
            onClick={() => setActiveModal('calendario')}
            className="p-3 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all group"
          >
            <CalendarIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </nav>
        {/* Login/User no fundo */}
        <div className="mt-auto">
          <button
            onClick={() => !user && navigate('/login')}
            className="p-3 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative scrollbar-hide">

        {/* HEADER */}
        <header className="absolute top-0 left-0 right-0 z-40 p-8 flex justify-between items-center bg-gradient-to-b from-[#0f0f13]/90 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar filmes..."
                className="bg-zinc-800/60 border border-white/5 rounded-full pl-9 pr-4 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/40 w-52 transition-all focus:w-64 backdrop-blur-md"
              />
            </div>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={() => !user && navigate('/login')}
              className="flex items-center gap-2 border border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white px-5 py-2 rounded-full text-sm font-bold tracking-wide cursor-pointer transition-all"
            >
              <User className="w-4 h-4" />
              {user ? user.nome ?? 'Minha Conta' : 'Entrar'}
            </button>
          </div>
        </header>

        {/* HERO */}
        <section className="relative w-full h-[75vh] flex items-end overflow-hidden shrink-0">
          {/* Imagem de Fundo (Backdrop) com alta qualidade */}
          <div className="absolute inset-0 z-0 bg-[#0f0f13]">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
              style={{ backgroundImage: `url('${heroBg}')` }}
            />
            {/* Sobreposição de Gradiente Escuro (Estilo Netflix) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-[#0f0f13]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f13] via-[#0f0f13]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
          </div>
          {loading ? (
            <div className="relative z-10 p-6 sm:p-12 w-full max-w-7xl mx-auto animate-pulse space-y-4">
              <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
              <div className="h-20 w-2/3 bg-zinc-800 rounded-xl mb-6" />
              <div className="h-24 w-1/2 bg-zinc-800 rounded-xl" />
            </div>
          ) : featuredMovie && (
            <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10 p-6 sm:p-12 w-full max-w-7xl mx-auto flex flex-col items-start">
              <motion.p variants={fadeUp} className="text-orange-400 text-xs sm:text-sm font-black uppercase tracking-[0.3em] mb-3 drop-shadow-md">Em Destaque</motion.p>
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-3 drop-shadow-lg">
                {featuredMovie.titulo}
              </motion.h1>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
                <span className="border border-zinc-500 text-white px-2 py-0.5 rounded text-xs font-bold bg-black/40 drop-shadow">
                  {featuredMovie.classificacao || '14'}
                </span>
                <span className="text-zinc-300 text-sm sm:text-base font-medium drop-shadow">{featuredMovie.genero || 'Ação, Drama'}</span>
                {featuredMovie.duracao && (
                  <span className="text-zinc-300 text-sm sm:text-base font-medium flex items-center gap-1 drop-shadow"><Clock className="w-4 h-4" />{featuredMovie.duracao}</span>
                )}
              </motion.div>
              <motion.p variants={fadeUp} className="text-zinc-300 text-sm sm:text-base md:text-lg max-w-2xl mb-8 leading-relaxed drop-shadow-md line-clamp-3">
                {featuredMovie.sinopse}
              </motion.p>
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                {featuredMovie.sessoes?.length > 0 && (
                  <button
                    onClick={() => navigate(`/sessao/${featuredMovie.sessoes[0].id}`)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
                  >
                    <Ticket className="w-5 h-5" />Comprar Ingresso
                  </button>
                )}
                <button className="bg-zinc-500/40 hover:bg-zinc-500/60 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-md transition-all flex items-center gap-2">
                  <Play className="w-5 h-5 group-hover:text-orange-400 transition-colors" />Trailer
                </button>
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* MOVIE GRID */}
        <section className="w-full max-w-7xl mx-auto p-6 sm:p-12 -mt-10 relative z-20 pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
            Em Cartaz {activeDate.toDateString() !== new Date().toDateString() ? `- ${activeDate.toLocaleDateString('pt-BR')}` : ''}
          </h2>
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
          >
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-full aspect-[2/3] bg-zinc-900/50 border border-white/5 rounded-lg animate-pulse" />
              ))
            ) : (
              filmes.map(filme => (
                <motion.article
                  variants={cardVariant}
                  key={filme.id}
                  className="flex flex-col gap-2 group cursor-pointer"
                >
                  <div className="w-full aspect-[2/3] rounded-lg overflow-hidden relative shadow-lg bg-zinc-800">
                    <img
                      src={getPoster(filme.id)}
                      alt={filme.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay do hover */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Sessões</span>
                      {filme.sessoes.length > 0 ? (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {filme.sessoes.slice(0, 4).map(sessao => (
                            <button
                              key={sessao.id}
                              onClick={() => navigate(`/sessao/${sessao.id}`)}
                              className="flex flex-col items-center px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded transition-colors text-[11px] font-bold shadow"
                            >
                              <span>{sessao.horario}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-xs font-medium italic">Sem sessões</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <h3 className="text-white font-semibold truncate text-sm sm:text-base group-hover:text-orange-400 transition-colors">
                      {filme.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-bold">
                        {filme.classificacao || '14'}
                      </span>
                      <p className="text-zinc-400 text-xs sm:text-sm truncate">
                        {filme.genero || 'Ação'}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </motion.div>
        </section>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(5,3,15,0.85)", backdropFilter: "blur(16px)" }}
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ duration: 0.35, type: 'tween' }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl"
              style={{
                background: 'linear-gradient(145deg, rgba(22,18,35,0.98) 0%, rgba(13,11,20,0.99) 100%)',
                backdropFilter: 'blur(48px)',
                border: '1px solid rgba(249,115,22,0.18)',
                boxShadow: '0 0 100px rgba(249,115,22,0.07), 0 0 60px rgba(168,85,247,0.05), 0 40px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.5),rgba(168,85,247,0.4),transparent)', zIndex: 1, pointerEvents: 'none' }} />

              {/* MODAL MINHAS RESERVAS */}
              {activeModal === 'reservas' && (
                <>
                  <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ background: "linear-gradient(90deg,#f97316,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Minha Conta</p>
                      <h2 className="text-2xl font-black text-white">Minhas Reservas</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-all hover:bg-white/10" style={{ backdropFilter: "blur(8px)" }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10 p-6 max-h-[60vh] overflow-y-auto">
                    {!user ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2 font-semibold">Faça login para ver suas reservas</p>
                        <button onClick={() => { setActiveModal(null); navigate('/login'); }} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:from-orange-400 hover:to-orange-500 transition-all">
                          Fazer Login
                        </button>
                      </div>
                    ) : reservas.length === 0 ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2 font-semibold">Nenhuma reserva encontrada</p>
                      </div>
                    ) : (
                      <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-3">
                        {reservas.map(r => (
                          <motion.div key={r.id} variants={fadeUp} className="flex items-start gap-4 rounded-2xl p-4 transition-all hover:scale-[1.01]" style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", backdropFilter: "blur(10px)" }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.25),rgba(168,85,247,0.15))", border: "1px solid rgba(249,115,22,0.25)" }}>
                              <Ticket className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-sm">{r.filme}</p>
                              <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />Sala {r.sala} • Assento <span className="text-orange-400 font-bold">{r.assento}</span>
                              </p>
                              <p className="text-zinc-600 text-xs mt-1">{r.data} às {r.horario}</p>
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {r.ingressos.map((ing, idx) => (
                                  <span key={idx} className="text-[9px] px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                    {ing.tipo} - R${ing.valor.toFixed(2)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-green-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0" style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.1))", border: "1px solid rgba(34,197,94,0.25)" }}>
                              <CheckCircle className="w-3 h-3" />OK
                            </div>
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
                  <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ background: "linear-gradient(90deg,#f97316,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Programação</p>
                      <h2 className="text-2xl font-black text-white capitalize">{monthName}</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-all hover:bg-white/10" style={{ backdropFilter: "blur(8px)" }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10 p-6" style={{ overflowX: 'hidden' }}>
                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 mb-2">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-wider py-2">{d}</div>
                      ))}
                    </div>
                    {/* Grade de dias */}
                    <div className="grid grid-cols-7 gap-1">
                      {calCells.map((day, i) => {
                        if (!day) return <div key={i} />;
                        const isToday = day === today.getDate();
                        const isPast = day < today.getDate();
                        const isSelected = day === selectedCalDay;
                        const hasSessao = sessionesCalendarData[day] && sessionesCalendarData[day].length > 0;
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.008, type: 'tween' }}
                            onClick={() => {
                              if (!isPast) {
                                setSelectedCalDay(day);
                                setActiveDate(new Date(today.getFullYear(), today.getMonth(), day));
                                setActiveModal(null);
                              }
                            }}
                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${isSelected && !isPast
                              ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                              : isToday
                                ? 'text-white shadow-xl ring-2 ring-orange-400/50'
                                : isPast
                                  ? 'text-zinc-700 cursor-default'
                                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer'
                            }`}
                          >
                            {day}
                            {hasSessao && !isPast && !isSelected && (
                              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-400" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Sessões do dia */}
                    {(() => {
                      const sessoesDoDia = getSessionsForDay(selectedCalDay);
                      const labelDia = selectedCalDay === today.getDate() ? 'Sessões de Hoje' : `Sessões do Dia ${selectedCalDay}`;

                      return (
                        <div className="mt-6 border-t border-white/5 pt-5 text-center">
                           <p className="text-sm text-zinc-400 mb-4">
                             Ao clicar em um dia, a grade principal de filmes será atualizada mostrando a programação exata.
                           </p>
                        </div>
                      );
                    })()}
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
