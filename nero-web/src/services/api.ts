import axios from 'axios';
import { io } from 'socket.io-client';

export const api = axios.create({
  baseURL: window.location.origin, // Pega automaticamente o IP e porta do anfitrião
});


// INJEÇÃO AUTOMÁTICA: Pega o token do cofre e bloqueia o Cache do navegador
api.interceptors.request.use((config) => {
  
  // 1. QUEBRA-CACHE ABSOLUTO: Impede que o telemóvel congele a tela
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }

  // 2. Envia a chave de segurança para o PC
  const token = sessionStorage.getItem('nero_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// DEFESA ABSOLUTA: Se o PC recusar a conexão, destroi tudo.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o servidor retornar 401 (Não Autorizado) -> Servidor reiniciou ou hack
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('nero_auth_token');
      window.location.href = '/'; // Redirecionamento nativo e forçado (mata o cache)
    }
    return Promise.reject(error);
  }
);

export const socket = io(window.location.origin, {
  autoConnect: false,
});