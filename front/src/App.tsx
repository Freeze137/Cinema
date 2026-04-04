import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SeatSelection } from './pages/SeatSelection';

// Componente para proteger rotas (exige usuário logado)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  // Renderiza a Árvore de Rotas do Sistema
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen font-sans text-zinc-100 bg-zinc-950">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rotas Protegidas */}
            <Route 
              path="/" 
              element={<ProtectedRoute><Home /></ProtectedRoute>} 
            />
            <Route 
              path="/sessao/:id" 
              element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} 
            />
            
            {/* Fallback de rotas - se errar a URL volta pra Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}