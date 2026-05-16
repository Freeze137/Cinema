import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SeatSelection } from './pages/SeatSelection';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sessao/:id" element={<SeatSelection />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}