import { createContext, useState, useEffect, type ReactNode, useContext } from 'react';
import { api } from '../services/api';

export interface AuthContextData {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('@Kinoplex:token');
    
    if (token) {
      // Injerta o token nas próximas requisições do axios automaticamente
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('@Kinoplex:token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('@Kinoplex:token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o Auth facilmente nos componentes
export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}