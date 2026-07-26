import axios from 'axios';

// Adicionamos o "export" direto na constante para permitir a importação nomeada com chaves { api }
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

/**
 * O token vive no localStorage e o backend o emite com validade de 60 minutos.
 * Sem esta reidratação, um F5 perdia o header e toda rota protegida devolvia 401.
 */
const tokenSalvo = localStorage.getItem('@Kinoplex:token');
if (tokenSalvo) {
  api.defaults.headers.common['Authorization'] = `Bearer ${tokenSalvo}`;
}

/**
 * Sessão inválida (token expirado ou usuário removido do banco) derruba o
 * login em vez de deixar a tela quebrando calada em cada requisição.
 */
api.interceptors.response.use(
  response => response,
  error => {
    const naoAutorizado = error?.response?.status === 401;
    const jaEstaNoLogin = window.location.pathname === '/login';

    if (naoAutorizado && !jaEstaNoLogin) {
      localStorage.removeItem('@Kinoplex:token');
      localStorage.removeItem('@Kinoplex:user');
      delete api.defaults.headers.common['Authorization'];
      window.location.assign('/login?sessao=expirada');
    }

    return Promise.reject(error);
  },
);

export default api;
