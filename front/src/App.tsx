import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { SeatSelection } from './pages/SeatSelection';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sessao/:id" element={<SeatSelection />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}