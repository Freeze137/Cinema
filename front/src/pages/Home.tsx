import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, Film } from 'lucide-react';

export function Home() {
  const { signOut, user } = useContext(AuthContext);

  return (
    <div className="min-h-screen p-8 bg-zinc-950">
      <header className="flex justify-between items-center max-w-6xl mx-auto mb-12 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <Film className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold tracking-wide">Em Cartaz</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-zinc-400 text-sm hidden md:inline">Logado como: <strong className="text-zinc-200">{user?.email}</strong></span>
          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg transition-all">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>
    </div>
  );
}