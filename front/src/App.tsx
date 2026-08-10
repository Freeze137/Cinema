import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageProvider';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SeatSelection } from './pages/SeatSelection';
import { Blog } from './pages/Blog';
import { Sobre } from './pages/Sobre';
import { Toaster } from './components/Toaster';

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      {/* Estilos globais injetados para ocultar a scrollbar nativa mantendo o scroll ativo */}
      <style dangerouslySetInnerHTML={{__html: `
        html, body {
          overflow-y: auto !important;
          -ms-overflow-style: none;  /* IE e Edge */
          scrollbar-width: none;  /* Firefox */
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar {
          display: none; /* Chrome, Safari e Opera */
        }
        /* Mesmo efeito para áreas roláveis internas (modais, listas). */
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
      {/*
        reducedMotion="user" faz todo componente do framer-motion respeitar a
        preferência do sistema: transform/layout viram transição instantânea e
        só opacidade continua animando. O equivalente para as transições CSS
        está no @media (prefers-reduced-motion) do index.css.
      */}
      <MotionConfig reducedMotion="user">
        <Router>
          <div className="min-h-screen w-full flex flex-col overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/sessao/:id" element={<SeatSelection />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<Blog />} />
              <Route path="/sobre" element={<Sobre />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </MotionConfig>
    </AuthProvider>
    </LanguageProvider>
  );
}