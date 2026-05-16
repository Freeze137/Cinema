import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ChevronLeft, Armchair, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/sessao/${id}`).then(res => setData(res.data));
  }, [id]);

  const rows = ['A','B','C','D','E','F','G','H'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  async function handleReserve() {
    try {
      await api.post('/api/reservas', { sessao_id: Number(id), assentos: selected });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); navigate('/'); }, 2500);
    } catch {
      setError('Erro ao processar a reserva. Tente novamente.');
      setTimeout(() => setError(''), 3000);
    }
  }

  if (!data) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-orange-400 font-black italic text-lg uppercase tracking-widest">A carregar sala...</p>
      </motion.div>
    </div>
  );

  const precoTotal = selected.length * data.detalhes.preco_ingresso;

  return (
    <div className="min-h-screen bg-[#0f0f13] text-zinc-100 pb-40 font-sans">

      {/* FEEDBACK TOAST */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity:0, y:-60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-60 }} transition={{ duration:0.4, ease:"easeOut" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-md">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">Reserva confirmada! Redirecionando...</span>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity:0, y:-60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-60 }} transition={{ duration:0.4, ease:"easeOut" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-md">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0f0f13]/90 backdrop-blur-md border-b border-white/5 p-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors font-bold text-sm uppercase tracking-widest group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black italic uppercase tracking-tighter">{data.filme.titulo}</h1>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">SALA {data.detalhes.sala} • {data.detalhes.horario}</p>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-12">

        {/* TELA */}
        <motion.div initial={{ opacity:0, scaleX:0.7 }} animate={{ opacity:1, scaleX:1 }} transition={{ duration:0.6, ease:"easeOut" }} className="relative mb-24 px-12">
          <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full shadow-[0_0_40px_rgba(249,115,22,0.6)]" />
          <div className="absolute top-0 left-12 right-12 h-20 bg-gradient-to-b from-orange-500/15 to-transparent blur-xl" />
          <p className="text-[10px] text-zinc-700 font-black text-center mt-8 tracking-[1em] uppercase">Ecrã de Projeção</p>
        </motion.div>

        {/* ASSENTOS */}
        <motion.div initial="hidden" animate="visible" variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.015 } } }} className="grid gap-4 justify-center">
          {rows.map((row, ri) => (
            <motion.div key={row} variants={{ hidden:{ opacity:0, x:-20 }, visible:{ opacity:1, x:0, transition:{ duration:0.4, delay: ri*0.05 } } }} className="flex gap-3 items-center">
              <span className="w-6 text-center text-zinc-700 font-black text-xs">{row}</span>
              <div className="flex gap-2 sm:gap-2.5">
                {cols.map(col => {
                  const code = `${row}${col}`;
                  const isOccupied = data.assentos_ocupados.includes(code);
                  const isSelected = selected.includes(code);
                  return (
                    <motion.button
                      key={code}
                      disabled={isOccupied}
                      whileHover={!isOccupied ? { y: -3, scale: 1.05 } : {}}
                      whileTap={!isOccupied ? { scale: 0.95 } : {}}
                      onClick={() => !isOccupied && setSelected(s => s.includes(code) ? s.filter(x => x !== code) : [...s, code])}
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                        isOccupied
                          ? 'bg-zinc-900/60 border border-white/5 text-zinc-800 cursor-not-allowed'
                          : isSelected
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40'
                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      <Armchair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {isSelected && (
                        <motion.span initial={{ scale:0 }} animate={{ scale:1 }} className="absolute -top-2 -right-2 bg-white text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{col}</motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <span className="w-6 text-center text-zinc-700 font-black text-xs">{row}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* LEGENDA */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.4 }} className="flex justify-center gap-6 sm:gap-12 mt-16 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-800 rounded-md" />Disponível</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/40 rounded-md" />Selecionado</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-900 border border-white/5 rounded-md" />Ocupado</div>
        </motion.div>
      </main>

      {/* BARRA DE CHECKOUT */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-0 left-0 w-full bg-[#0f0f13]/95 backdrop-blur-xl border-t border-orange-500/10 p-6 z-50"
          >
            {/* gradiente topo */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent"></div>
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">{selected.length} ASSENTO{selected.length > 1 ? 'S' : ''} SELECIONADO{selected.length > 1 ? 'S' : ''}</p>
                <div className="flex gap-2 flex-wrap">
                  {selected.map(seat => (
                    <motion.span key={seat} initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                      className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer hover:bg-orange-500/20 transition-colors"
                      onClick={() => setSelected(s => s.filter(x => x !== seat))}
                    >{seat} ×</motion.span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total a pagar</p>
                  <p className="text-3xl font-black text-white">R$ <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">{precoTotal.toFixed(2)}</span></p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleReserve}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:from-orange-400 hover:to-orange-500 transition-all shadow-xl shadow-orange-500/30"
                >
                  FINALIZAR COMPRA
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}