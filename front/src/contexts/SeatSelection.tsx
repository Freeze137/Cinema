import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ChevronLeft, Armchair } from 'lucide-react';

export function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    api.get(`/api/sessao/${id}`).then(res => setData(res.data));
  }, [id]);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  async function handleReserve() {
    try {
      await api.post('/api/reservas', { sessao_id: Number(id), assentos: selected });
      alert("Reserva confirmada com sucesso!");
      navigate('/');
    } catch { 
      alert("Erro ao processar a reserva."); 
    }
  }

  if (!data) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-orange-500 font-black italic text-2xl uppercase tracking-tighter">A carregar sala...</div>;

  const precoTotal = selected.length * data.detalhes.preco_ingresso;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 pb-32 font-sans selection:bg-orange-500/30">
      
      {/* HEADER DA SALA */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 p-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest">
            <ChevronLeft className="w-5 h-5" /> Voltar
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black italic uppercase tracking-tighter">{data.filme.titulo}</h1>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">SALA {data.detalhes.sala} • {data.detalhes.horario}</p>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-12">
        
        {/* TELA DE CINEMA */}
        <div className="relative mb-24 px-12">
          <div className="w-full h-1.5 bg-orange-500 rounded-full shadow-[0_0_40px_rgba(249,115,22,0.6)]" />
          <div className="absolute top-0 left-12 right-12 h-16 bg-gradient-to-b from-orange-500/20 to-transparent blur-xl" />
          <p className="text-[10px] text-zinc-600 font-black text-center mt-6 tracking-[1em] uppercase">Ecrã de Projeção</p>
        </div>
        
        {/* MAPA DE ASSENTOS */}
        <div className="grid gap-6 justify-center">
          {rows.map(row => (
            <div key={row} className="flex gap-4 items-center">
              <span className="w-6 text-center text-zinc-600 font-black text-xs">{row}</span>
              <div className="flex gap-2 sm:gap-3">
                {cols.map(col => {
                  const code = `${row}${col}`;
                  const isOccupied = data.assentos_ocupados.includes(code);
                  const isSelected = selected.includes(code);

                  return (
                    <button
                      key={code}
                      disabled={isOccupied}
                      onClick={() => setSelected(s => s.includes(code) ? s.filter(x => x !== code) : [...s, code])}
                      className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isOccupied ? 'bg-zinc-900 border border-white/5 text-zinc-800 cursor-not-allowed' :
                        isSelected ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-500/40 -translate-y-1' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:-translate-y-1'
                      }`}
                    >
                      <Armchair className="w-4 h-4 sm:w-5 sm:h-5" />
                      {isSelected && <span className="absolute -top-2 -right-2 bg-white text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{col}</span>}
                    </button>
                  );
                })}
              </div>
              <span className="w-6 text-center text-zinc-600 font-black text-xs">{row}</span>
            </div>
          ))}
        </div>

        {/* LEGENDA */}
        <div className="flex justify-center gap-6 sm:gap-12 mt-16 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-800 rounded-md" /> Disponível</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 shadow-lg shadow-orange-500/40 rounded-md" /> Selecionado</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-zinc-900 border border-white/5 rounded-md" /> Ocupado</div>
        </div>

      </main>

      {/* BARRA FIXA DE CHECKOUT */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-white/10 p-6 z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">{selected.length} LUGARES SELECIONADOS</p>
              <div className="flex gap-2">
                {selected.map(seat => (
                  <span key={seat} className="bg-zinc-800 text-white px-2 py-1 rounded text-xs font-bold">{seat}</span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total a pagar</p>
                <p className="text-2xl font-black text-white italic tracking-tighter">R$ {precoTotal.toFixed(2)}</p>
              </div>
              <button 
                onClick={handleReserve}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-orange-400 hover:scale-105 transition-all shadow-lg shadow-orange-500/30"
              >
                FINALIZAR COMPRA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}