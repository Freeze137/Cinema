import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Lock, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/languageContext';

export function Login() {
  const { signIn } = useContext(AuthContext);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signIn({ email, password });
      navigate('/'); // Redireciona para Home após o login
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error'));
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 px-4">
      <div className="flex items-center gap-3 mb-10">
        <Clapperboard className="w-12 h-12 text-red-600" />
        <h1 className="text-5xl font-bold tracking-widest text-zinc-100">KINOPLEX</h1>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-center text-zinc-200">{t('login.subtitle')}</h2>
        
        {error && <div className="mb-6 p-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg text-center">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-400">{t('login.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-zinc-100 focus:outline-none focus:border-red-600 transition-colors" placeholder="seu@email.com" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-400">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg py-3 pl-11 pr-4 text-zinc-100 focus:outline-none focus:border-red-600 transition-colors" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3.5 rounded-lg transition-all duration-150 ease-out transform active:scale-[0.98] shadow-lg shadow-red-600/20">
            {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}