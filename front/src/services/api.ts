import axios from 'axios';

// Adicionamos o "export" direto na constante para permitir a importação nomeada com chaves { api }
export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

export default api;