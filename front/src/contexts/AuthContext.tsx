import { createContext, useState, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  id?: number;
  nome: string;
  email: string;
}

interface AuthContextData {
  user: User | null;
  signIn: (credentials: any) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('@Kinoplex:token');
    const userData = localStorage.getItem('@Kinoplex:user');

    if (token && userData) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return JSON.parse(userData);
    }

    return null;
  });

  async function signIn({ email, password }: any) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, user: userData } = response.data;
    localStorage.setItem('@Kinoplex:token', access_token);
    localStorage.setItem('@Kinoplex:user', JSON.stringify(userData));

    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
  }

  function signOut() {
    localStorage.removeItem('@Kinoplex:token');
    localStorage.removeItem('@Kinoplex:user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}