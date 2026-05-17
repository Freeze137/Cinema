import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Film, Ticket, Clock, Search, User, Play, Compass, Star, Calendar as CalendarIcon, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface Sessao { id: number; horario: string; sala: string; preco: number; }
interface Filme { id: number; titulo: string; sinopse: string; duracao?: string; genero?: string; classificacao?: string; sessoes: Sessao[]; }
interface Reserva { id: number; assento: string; sessao_id: number; }
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
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(0);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCalDay, setSelectedCalDay] = useState<number>(new Date().getDate());
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

  useEffect(() => {
    if (activeModal === 'reservas' && user) {
      api.get('/api/reservas').then(r => setReservas(r.data)).catch(() => setReservas([]));
    }
  }, [activeModal, user]);

  const featuredMovie = filmes.length > 0 ? filmes[0] : null;
  const dates = ['HOJE 15', 'DOM 16', 'SEG 17', 'TER 18', 'QUA 19'];

  // Gera sessões fictícias futuras com base nos filmes disponíveis
  function getSessionsForDay(day: number) {
    if (filmes.length === 0) return [];
    // Distribui filmes pelos dias de forma determinística
    const seed = day + today.getMonth();
    return filmes
      .filter((_, i) => (seed + i) % 3 !== 0) // ~2/3 dos filmes por dia
      .slice(0, 4)
      .map((f, i) => {
        const horas = ['14:00','16:30','19:00','21:30'];
        return { filme: f, horario: horas[i % horas.length], sala: `Sala ${(i % 3) + 1}`, preco: [35,40,45][i % 3] };
      });
  }

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

  return (
    <div className="flex h-screen bg-[#0f0f13] text-zinc-100 font-sans overflow-hidden" style={{overflowX:"hidden"}}>

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
          <div className="absolute inset-0 z-0">
            <img src={heroBg} alt="hero" className="w-full h-full object-cover opacity-25" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-[#0f0f13]/60 to-[#0f0f13]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f13]/80 to-transparent" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
          </div>
          {loading ? (
            <div className="relative z-10 px-10 xl:px-20 pb-16 w-full animate-pulse space-y-4">
              <div className="h-4 w-32 bg-zinc-800 rounded" />
              <div className="h-16 w-2/3 bg-zinc-800 rounded-xl" />
              <div className="h-20 w-1/2 bg-zinc-800 rounded-xl" />
            </div>
          ) : featuredMovie && (
            <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10 px-10 xl:px-20 pb-16 max-w-3xl">
              <motion.p variants={fadeUp} className="text-orange-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Em Destaque</motion.p>
              <motion.h1 variants={fadeUp} className="text-5xl xl:text-7xl font-black italic uppercase leading-none text-white mb-4 drop-shadow-2xl">
                {featuredMovie.titulo}
              </motion.h1>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                  {featuredMovie.classificacao || '14'}
                </span>
                <span className="text-zinc-400 text-xs">{featuredMovie.genero || 'Ação, Drama'}</span>
                {featuredMovie.duracao && (
                  <span className="text-zinc-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{featuredMovie.duracao}</span>
                )}
              </motion.div>
              <motion.p variants={fadeUp} className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-xl line-clamp-3">
                {featuredMovie.sinopse}
              </motion.p>
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                {featuredMovie.sessoes?.length > 0 && (
                  <button
                    onClick={() => navigate(`/sessao/${featuredMovie.sessoes[0].id}`)}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5"
                  >
                    <Ticket className="w-5 h-5" />Comprar Ingresso
                  </button>
                )}
                <button className="bg-zinc-900/80 border border-white/5 hover:bg-zinc-800 text-white px-8 py-4 rounded-xl font-bold tracking-wide flex items-center gap-2 transition-all hover:-translate-y-0.5 group backdrop-blur-md">
                  <Play className="w-5 h-5 group-hover:text-orange-400 transition-colors" />Trailer
                </button>
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* DATE SELECTOR */}
        <section className="px-10 xl:px-20 mt-10 mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDate(idx)}
                className={`shrink-0 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                  activeDate === idx
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
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
              {[1,2,3].map(i => (
                <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-[2rem] h-[500px] animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden" animate="visible" variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              {filmes.map(filme => (
                <motion.div
                  variants={cardVariant}
                  key={filme.id}
                  className="relative flex flex-col bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-orange-500/30 transition-all duration-500 shadow-xl"
                >
                  <div className="relative h-[380px] w-full overflow-hidden">
                    <img
                      src={getPoster(filme.id)}
                      alt={filme.titulo}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <h2 className="text-3xl font-black italic text-white mb-2 leading-tight uppercase drop-shadow-md">{filme.titulo}</h2>
                      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300">
                        <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />{filme.classificacao || '14'}
                        </span>
                        <span className="opacity-70">{filme.genero || 'Ação'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-2 bg-zinc-950/50 flex-1 flex flex-col">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Sessões</span>
                    {filme.sessoes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filme.sessoes.map(sessao => (
                          <button
                            key={sessao.id}
                            onClick={() => navigate(`/sessao/${sessao.id}`)}
                            className="flex flex-col items-start px-4 py-2 bg-orange-500/10 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 text-orange-400 hover:text-white border border-orange-500/30 hover:border-orange-500 rounded-xl transition-all"
                          >
                            <span className="text-sm font-bold tracking-wider">{sessao.horario}</span>
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

      {/* ===== MODAIS ===== */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{background:"rgba(5,3,15,0.85)",backdropFilter:"blur(16px)"}}
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
              {/* Glow laranja topo-esquerda */}
              <div style={{position:'absolute',top:'-40px',left:'-40px',width:'220px',height:'220px',borderRadius:'50%',background:'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',pointerEvents:'none',zIndex:0}} />
              {/* Glow roxo baixo-direita */}
              <div style={{position:'absolute',bottom:'-40px',right:'-40px',width:'200px',height:'200px',borderRadius:'50%',background:'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',pointerEvents:'none',zIndex:0}} />
              {/* Linha de gradiente no topo */}
              <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(249,115,22,0.5),rgba(168,85,247,0.4),transparent)',zIndex:1,pointerEvents:'none'}} />

              {/* MODAL MINHAS RESERVAS */}
              {activeModal === 'reservas' && (
                <>
                  <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{background:"linear-gradient(90deg,#f97316,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Minha Conta</p>
                      <h2 className="text-2xl font-black text-white">Minhas Reservas</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-all hover:bg-white/10" style={{backdropFilter:"blur(8px)"}}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10 p-6 max-h-[60vh] overflow-y-auto">
                    {!user ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2 font-semibold">Faça login para ver suas reservas</p>
                        <p className="text-zinc-600 text-sm mb-6">Acesse sua conta para gerenciar seus ingressos</p>
                        <button onClick={() => { setActiveModal(null); navigate('/login'); }} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:from-orange-400 hover:to-orange-500 transition-all">
                          Fazer Login
                        </button>
                      </div>
                    ) : reservas.length === 0 ? (
                      <div className="text-center py-12">
                        <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2 font-semibold">Nenhuma reserva encontrada</p>
                        <p className="text-zinc-600 text-sm">Compre ingressos para ver aqui</p>
                      </div>
                    ) : (
                      <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col gap-3">
                        {reservas.map(r => (
                          <motion.div key={r.id} variants={fadeUp} className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:scale-[1.01]" style={{background:"rgba(249,115,22,0.05)",border:"1px solid rgba(249,115,22,0.15)",backdropFilter:"blur(10px)"}}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:"linear-gradient(135deg,rgba(249,115,22,0.25),rgba(168,85,247,0.15))",border:"1px solid rgba(249,115,22,0.25)"}}>
                              <Ticket className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold text-sm">Reserva #{r.id}</p>
                              <p className="text-zinc-500 text-xs mt-0.5">
                                Assento <span className="text-orange-400 font-bold">{r.assento}</span> • Sessão #{r.sessao_id}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-green-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider" style={{background:"linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.1))",border:"1px solid rgba(34,197,94,0.25)"}}>
                              <CheckCircle className="w-3 h-3" />Confirmado
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
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{background:"linear-gradient(90deg,#f97316,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Programação</p>
                      <h2 className="text-2xl font-black text-white capitalize">{monthName}</h2>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg transition-all hover:bg-white/10" style={{backdropFilter:"blur(8px)"}}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10 p-6" style={{overflowX:'hidden'}}>
                    {/* Dias da semana */}
                    <div className="grid grid-cols-7 mb-2">
                      {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-wider py-2">{d}</div>
                      ))}
                    </div>
                    {/* Grade */}
                    <div className="grid grid-cols-7 gap-1">
                      {calCells.map((day, i) => {
                        if (!day) return <div key={i} />;
                        const isToday = day === today.getDate();
                        const isPast = day < today.getDate();
                        const isSelected = day === selectedCalDay;
                        const hasSessao = !isPast && filmes.some(f => f.sessoes?.length > 0);
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.008, type: 'tween' }}
                            onClick={() => !isPast && setSelectedCalDay(day)}
                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                              isSelected && !isPast
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

                    {/* Sessões do dia selecionado */}
                    {(() => {
                      const sessoesDoDia = getSessionsForDay(selectedCalDay);
                      const labelDia = selectedCalDay === today.getDate()
                        ? 'Sessões de Hoje'
                        : `Sessões do Dia ${selectedCalDay}`;

                      let conteudo: React.ReactNode;
                      if (loading) {
                        conteudo = (
                          <div className="animate-pulse space-y-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-16 bg-zinc-800/50 rounded-xl" />
                            ))}
                          </div>
                        );
                      } else if (sessoesDoDia.length === 0) {
                        conteudo = (
                          <div className="text-center py-8">
                            <Film className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-600 text-sm">Sem sessões para este dia</p>
                          </div>
                        );
                      } else {
                        conteudo = (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={selectedCalDay}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.25, type: 'tween' }}
                              className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1"
                              style={{ scrollbarWidth: 'none' }}
                            >
                              {sessoesDoDia.map((s, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.06, type: 'tween' }}
                                  className="flex items-center gap-3 rounded-2xl p-2 cursor-pointer group transition-all hover:scale-[1.01]"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.1)', backdropFilter: 'blur(12px)' }}
                                  onClick={() => {
                                    if (s.filme.sessoes?.length > 0) {
                                      navigate(`/sessao/${s.filme.sessoes[0].id}`);
                                      setActiveModal(null);
                                    }
                                  }}
                                >
                                  <div className="shrink-0 w-12 h-16 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
                                    <img
                                      src={`https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=100&q=70&sig=${s.filme.id}`}
                                      alt={s.filme.titulo}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-bold truncate mb-0.5">{s.filme.titulo}</p>
                                    <p className="text-zinc-500 text-xs mb-1">{s.sala} &bull; {s.horario}</p>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
                                      {s.filme.genero || 'Ação'}
                                    </span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="font-black text-base" style={{ background: 'linear-gradient(90deg,#f97316,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                      R$ {s.preco.toFixed(2)}
                                    </p>
                                    <p className="text-zinc-600 text-[10px] group-hover:text-orange-400 transition-colors mt-0.5">Comprar -&gt;</p>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          </AnimatePresence>
                        );
                      }

                      return (
                        <div className="mt-6 border-t border-white/5 pt-5">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ background: 'linear-gradient(90deg,#f97316,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                              {labelDia}
                            </p>
                            <span className="text-[10px] text-zinc-600 font-medium">
                              {sessoesDoDia.length} sessões
                            </span>
                          </div>
                          {conteudo}
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