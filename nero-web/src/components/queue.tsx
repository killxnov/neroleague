interface ReadyCheckModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  timerInfo?: { timeLeft: number, totalTime: number };
}

export const ReadyCheckModal = ({ isOpen, onAccept, onDecline, timerInfo }: ReadyCheckModalProps) => {
  if (!isOpen) return null;

  const percentage = timerInfo ? Math.max(0, Math.min(100, (timerInfo.timeLeft / timerInfo.totalTime) * 100)) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#000000] border border-white/10 p-8 rounded-2xl flex flex-col items-center gap-6 shadow-2xl">
        <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase">Partida Encontrada</h2>
        
        {/* Barrinha Animada do Timer */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ffffff] rounded-full transition-all duration-1000 ease-linear" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button onClick={onAccept} className="px-8 py-3 bg-[#398fff] hover:bg-[#364f85] text-white font-black uppercase tracking-widest rounded-xl transition-colors">Aceitar</button>
          <button onClick={onDecline} className="px-8 py-3 bg-transparent border border-red-500 text-red-500 hover:bg-red-300 hover:text-black font-black uppercase tracking-widest rounded-xl transition-colors">Recusar</button>
        </div>
      </div>
    </div>
  );
};