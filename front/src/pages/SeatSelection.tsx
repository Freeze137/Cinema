import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MonitorPlay } from 'lucide-react';

export function SeatSelection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <MonitorPlay className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Seleção de Assentos</h1>
        </div>
        <p className="text-zinc-400 mb-10 pl-11">Sessão {id}</p>
      </div>
    </div>
  );
}