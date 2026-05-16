import { createContext, useState, type ReactNode } from 'react';
import api from '../services/api';

interface User {
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
    const email = localStorage.getItem('@Kinoplex:email');
    
    if (token && email) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Como a API não retorna o nome no login atualmente, usamos o prefixo do email
      return { nome: email.split('@')[0], email }; 
    }
    
    return null;
  });

  async function signIn({ email, password }: any) {
    // O FastAPI com OAuth2PasswordRequestForm exige o envio em formato x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = response.data;
    localStorage.setItem('@Kinoplex:token', access_token);
    localStorage.setItem('@Kinoplex:email', email);

    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser({ nome: email.split('@')[0], email });
  }

  function signOut() {
    localStorage.removeItem('@Kinoplex:token');
    localStorage.removeItem('@Kinoplex:email');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}