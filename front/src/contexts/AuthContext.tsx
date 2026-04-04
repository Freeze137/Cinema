import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  email: string;
}

interface AuthContextData {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (credentials: Record<string, string>) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const isAuthenticated = !!user;

  useEffect(() => {
    const token = localStorage.getItem('@Kinoplex:token');
    if (token) {
      // Simulando a persistência do usuário logado (pode ser ajustado buscando do backend via /me)
      setUser({ email: 'usuario logado' });
    }
  }, []);

  async function signIn(credentials: Record<string, string>) {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('@Kinoplex:token', response.data.access_token);
      setUser({ email: credentials.email });
    } catch (error) {
      throw new Error('E-mail ou senha incorretos');
    }
  }

  function signOut() {
    localStorage.removeItem('@Kinoplex:token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}