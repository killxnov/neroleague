import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api } from '../services/api'; // Ajuste o caminho da sua api se necessário

export function ProtectedRoute() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSecurity = async () => {
      const token = sessionStorage.getItem('nero_auth_token');
      
      // Sem token? Nem tenta.
      if (!token) {
        setIsAuthorized(false);
        return;
      }

      try {
        // Bate na porta do servidor para ver se a memória dele ainda lembra desse token
        await api.post('/api/verify');
        setIsAuthorized(true); // O servidor confirmou.
      } catch (error) {
        setIsAuthorized(false); // O servidor negou (ex: foi reiniciado).
      }
    };

    checkSecurity();
  }, []);

  // Enquanto a internet pensa, mostramos um aviso de segurança.
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <span className="text-white text-xs font-black tracking-[0.3em] uppercase animate-pulse">
          Autenticando Conexão...
        </span>
      </div>
    );
  }

  // Passou? Renderiza o Dashboard. Não passou? Chuta pro Login.
  return isAuthorized ? <Outlet /> : <Navigate to="/" replace />;
}