interface LobbyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: any;
}

export const LobbyCreateModal = ({ isOpen, onClose, socket }: LobbyCreateModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-40 p-4 animate-fade-in">
      <div className="glass-card p-8 lg:p-10 rounded-[2rem] w-full max-w-sm shadow-2xl border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase">Modo de Jogo</h2>
          <button onClick={onClose} className="text-slate-500 text-3xl cursor-pointer hover:text-white transition-colors">&times;</button>
        </div>
        <div className="flex flex-col gap-4">
          <button onClick={() => { socket.emit('lol:create-lobby', 420); onClose(); }} className="p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white hover:text-black text-slate-300 text-left transition-all font-bold tracking-widest uppercase text-xs">Ranked Solo/Duo</button>
          <button onClick={() => { socket.emit('lol:create-lobby', 440); onClose(); }} className="p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white hover:text-black text-slate-300 text-left transition-all font-bold tracking-widest uppercase text-xs">Ranked FLEX</button>
          <button onClick={() => { socket.emit('lol:create-lobby', 400); onClose(); }} className="p-5 rounded-2xl bg-white/10 border border-white/30 cursor-pointer hover:bg-white hover:text-black text-white text-left transition-all font-black tracking-widest uppercase text-xs shadow-lg">Normal (Draft)</button>
          {/* <button onClick={() => { socket.emit('lol:create-lobby', 490); onClose(); }} className="p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white hover:text-black text-slate-300 text-left transition-all font-bold tracking-widest uppercase text-xs">Quick Play</button> */}
          <button onClick={() => { socket.emit('lol:create-lobby', 450); onClose(); }} className="p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white hover:text-black text-slate-300 text-left transition-all font-bold tracking-widest uppercase text-xs">ARAM</button>
        </div>
      </div>
    </div>
  );
};