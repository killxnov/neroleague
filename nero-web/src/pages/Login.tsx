import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socket } from '../services/socket';
import sentinelIcon from '../assets/sentinel.ico';
import { ShinyButton } from '../assets/button';
import { OTPInput, type OTPStatus } from '../assets/form';

export function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [otpStatus, setOtpStatus] = useState<OTPStatus>('idle'); // <--- Novo Estado
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConnecting || pin.length !== 4) return;
    
    setError('');
    setOtpStatus('idle');
    setIsConnecting(true);

    try {
      const response = await api.post('/api/auth', { pin });
      if (response.data.success) {
        setOtpStatus('success'); // Ativa animação de sucesso
        sessionStorage.setItem('nero_auth_token', response.data.token);
        socket.connect();
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      }
    } catch (err) {
      setError('PIN incorreto ou League não encontrado');
      setOtpStatus('error'); // Ativa a animação "tremida" vermelha
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-45 from-[#000000] from-10% via-[#02001418] via-30% to-[#000425] to-90% flex items-center justify-center p-4 overflow-hidden">
      {/* === BACKGROUND === */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in w-full max-w-sm">
        
        {/* Logo */}
        <div className="w-24 h-24 bg-black/40 border-2 border-[#ffffffa1] backdrop-blur-md rounded-[24px] flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(225,225,225,0.3)] rotate-3 overflow-hidden">
          <img src={sentinelIcon} alt="Ícone Nero" className="w-full h-full object-cover -rotate-3 scale-110 drop-shadow-[0_0_15px_rgba(10,200,185,0.6)]" />
        </div>
        
        {/* Título */}
        <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ffffff] to-[#1d1d1d] tracking-widest mb-1 text-center drop-shadow-sm mb-10">
          NERO
        </h1>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="w-full //glass-card p-6 lg:p-8 //rounded-[2rem] shadow-xl //border //border-white/10 backdrop-blur-md flex flex-col items-center">
          
          {/* Componente OTP */}
          <OTPInput
            length={4}
            value={pin}
            status={otpStatus}
            errorMessage={error}
            disabled={isConnecting || otpStatus === 'success'}
            className="mb-8"
            onChange={(v) => {
              setPin(v);
              // Só limpa o erro e o status se o utilizador começar a escrever um novo PIN (v.length > 0)
              if (v.length > 0) {
                if (otpStatus !== 'idle') setOtpStatus('idle');
                if (error) setError('');
              }
            }}
          />

          <ShinyButton 
            type="submit" 
            disabled={pin.length !== 4 || isConnecting || otpStatus === 'success'}
            onClick={handleLogin}
          >
            {isConnecting ? "Conectando..." : "Conectar"}
          </ShinyButton>
        </form>
        
        {/* Footer info */}
        <p className="mt-8 text-[#ffffff96] text-[10px] uppercase tracking-widest font-semibold">
          dan | @killxnov
        </p>
      </div>
    </div>
  );
}