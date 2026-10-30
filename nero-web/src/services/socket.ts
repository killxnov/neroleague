import { io } from 'socket.io-client';

const currentHost = window.location.hostname;

// Garante que o Socket.io conecte no IP correto da rede e envie o token de autorização
export const socket = io(`http://${currentHost}:3000`, {
  autoConnect: false,
  auth: {
    token: sessionStorage.getItem('nero_auth_token') // Envia o token para o backend autenticar o socket do celular
  }
});