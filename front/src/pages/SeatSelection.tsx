import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Armchair, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface SessaoData {
  filme: { titulo: string; duracao: string; avaliacao: string; genero: string; sinopse: string };
  detalhes: { cinema: string; sala: string; horario: string; preco_ingresso: number };
  assentos_ocupados: string[];
}

export function SeatSelection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    // 1. Busca os dados da Sessão
    api.get(`/api/sessao/${id}`).then((response) => {
      setSession(response.data);
      setOccupiedSeats(response.data.assentos_ocupados);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });

    // 2. Conecta ao WebSocket para atualizações em tempo real
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/sessao/${id}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "seats_updated") {
        setOccupiedSeats((prev) => [...new Set([...prev, ...data.assentos_novos])]);
        // Remove da seleção local se o assento recém-ocupado estava selecionado
        setSelectedSeats((prev) => prev.filter(seat => !data.assentos_novos.includes(seat)));
      }
    };
    return () => ws.close();
  }, [id]);

  const toggleSeat = (codigo: string) => {
    if (occupiedSeats.includes(codigo)) return;
    setSelectedSeats(prev => 
      prev.includes(codigo) ? prev.filter(s => s !== codigo) : [...prev, codigo]
    );
  };

  const handleCheckout = async () => {
    if (selectedSeats.length === 0) return;
    try {
      await api.post('/api/reservas', { sessao_id: Number(id), assentos: selectedSeats });
      alert('Reserva concluída com sucesso!');
      navigate('/'); // Ou navegue para /minhas-reservas
    } catch (error) {
      alert('Erro ao confirmar reserva. Tente novamente.');
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex justify-center items-center">
        <div className="animate-spin text-red-600"><Armchair size={48} /></div>
      </div>
    );
  }

  const totalValue = selectedSeats.length * session.detalhes.preco_ingresso;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans selection:bg-red-500/30">
      {/* HEADER */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 p-6 sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl"
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-red-500 mb-3 flex items-center gap-2 text-sm font-bold tracking-wide transition-colors duration-300">
              <ArrowLeft size={16} /> Voltar para cartaz
            </button>
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">{session.filme.titulo}</h1>
            <p className="text-zinc-400 mt-2 font-medium tracking-wide flex items-center gap-3">
              <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs">{session.detalhes.cinema}</span>
              <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs">Sala {session.detalhes.sala}</span>
              <span className="bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold">{session.detalhes.horario}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-5xl mx-auto mt-12 p-4 grid grid-cols-1 lg:grid-cols-3 gap-16"
      >
        {/* SEAT MAP */}
        <div className="col-span-2 flex flex-col items-center">
          {/* TELA DO CINEMA PREMIUM */}
          <div className="w-full max-w-2xl h-24 relative flex items-end justify-center mb-24 mt-4 perspective-[1000px]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[100%] border-t-[4px] border-white/40 shadow-[0_-15px_60px_rgba(255,255,255,0.15)] filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent rounded-[100%]"></div>
            <span className="text-zinc-500 text-[10px] font-black tracking-[0.6em] uppercase absolute -bottom-8">Tela do Cinema</span>
          </div>

          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row} className="flex gap-2 lg:gap-4 justify-center items-center group/row">
                <span className="w-6 text-center font-bold text-zinc-600 text-sm mr-4">{row}</span>
                {cols.map((col) => {
                  const seatCode = `${row}${col}`;
                  const isOccupied = occupiedSeats.includes(seatCode);
                  const isSelected = selectedSeats.includes(seatCode);
                  
                  return (
                    <button
                      key={seatCode}
                      disabled={isOccupied}
                      onClick={() => toggleSeat(seatCode)}
                      className="relative flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-2 hover:scale-110 outline-none focus:ring-2 focus:ring-red-500/50 rounded-xl"
                    >
                      <Armchair 
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className={`w-8 h-8 lg:w-[42px] lg:h-[42px] transition-all duration-300 ${
                          isOccupied ? 'text-purple-950 drop-shadow-[0_0_2px_rgba(88,28,135,0.3)] cursor-not-allowed opacity-50' 
                          : isSelected ? 'text-red-500 drop-shadow-[0_0_12px_rgba(220,38,38,0.8)] fill-red-500/20 scale-110 -translate-y-1' 
                          : 'text-zinc-700 hover:text-zinc-300 drop-shadow-md hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                        }`} 
                      />
                      <span className={`text-[9px] font-black absolute bottom-[-14px] transition-colors duration-300 ${
                        isSelected ? 'text-red-400' : isOccupied ? 'text-transparent' : 'text-zinc-600 group-hover/row:text-zinc-400'
                      }`}>{col}</span>
                    </button>
                  );
                })}
                <span className="w-6 text-center font-bold text-zinc-600 text-sm ml-4">{row}</span>
              </div>
            ))}
          </div>

          {/* LEGENDA */}
          <div className="flex justify-center gap-10 mt-20 text-sm font-medium text-zinc-400 bg-zinc-900/60 backdrop-blur-md py-4 px-10 rounded-2xl border border-zinc-800/80 shadow-xl">
            <div className="flex items-center gap-3"><Armchair className="w-5 h-5 text-zinc-700" /> Disponível</div>
            <div className="flex items-center gap-3"><Armchair className="w-5 h-5 text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] fill-red-500/20" /> Selecionado</div>
            <div className="flex items-center gap-3"><Armchair className="w-5 h-5 text-purple-950 opacity-50" /> Ocupado</div>
          </div>
        </div>

        {/* SUMMARY / CHECKOUT */}
        <div className="bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/80 h-fit sticky top-32 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 hover:border-zinc-700">
          <h3 className="text-2xl font-extrabold text-white mb-8 flex items-center gap-3"><Info className="text-red-500 w-6 h-6" /> Seu Ingresso</h3>
          
          <div className="flex-1 min-h-[120px]">
            {selectedSeats.length === 0 ? (
              <p className="text-zinc-500 text-center font-medium italic mt-10 text-sm">Selecione suas poltronas no mapa ao lado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map(s => (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={s} className="bg-gradient-to-br from-zinc-800 to-zinc-900 px-4 py-2 rounded-xl text-red-400 font-black border border-zinc-700 shadow-inner tracking-wider">{s}</motion.span>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-zinc-800 pt-6 mt-6">
            <div className="flex justify-between text-zinc-400 mb-3 font-medium text-sm"><span>Ingressos selecionados</span> <span className="text-white font-bold">{selectedSeats.length}x</span></div>
            <div className="flex justify-between items-end mb-8">
              <span className="text-zinc-500 font-medium">Total a pagar</span> 
              <span className="text-4xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.2)]">R$ {totalValue.toFixed(2)}</span>
            </div>
            
            <button onClick={handleCheckout} disabled={selectedSeats.length === 0} className="w-full relative group/btn disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="absolute inset-0 bg-red-600 rounded-2xl blur group-hover/btn:blur-md transition-all duration-300 opacity-70 group-disabled/btn:hidden"></div>
              <div className="relative bg-red-600 group-hover/btn:bg-red-500 text-white font-black text-lg py-5 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 uppercase tracking-wide border border-red-400/50">
                Finalizar Compra
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}