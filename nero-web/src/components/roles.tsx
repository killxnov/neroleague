import { useState } from 'react';
import { ROLE_ICONS, ROLE_NAMES } from '../utils/constants';

interface RoleCarouselProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
}

export const RoleCarousel = ({ value, onChange, label }: RoleCarouselProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isUnselected = value === 'UNSELECTED' || !value;
  const selectableRoles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'FILL'];

  return (
    <div className="relative flex-1" onMouseLeave={() => setIsOpen(false)}>
      {/* Botão Principal */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card cursor-pointer p-4 rounded-2xl flex flex-col items-center justify-center transition-all border border-white/10 hover:border-white/30 hover:bg-white/5 w-full shadow-lg"
      >
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2 transition-colors">{label}</span>
        
        <div className={`w-12 h-12 rounded-full border border-white/10 bg-black/40 flex items-center justify-center mb-2 transition-all duration-300 ${isOpen ? 'scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)] border-white/30' : ''} ${isUnselected ? 'opacity-40 grayscale' : 'opacity-100 border-white/30'}`}>
          <img src={ROLE_ICONS[value] || ROLE_ICONS.UNSELECTED} alt={value} className="w-8 h-8 drop-shadow-md" />
        </div>
        
        <span className={`text-[9px] font-black tracking-widest uppercase transition-colors ${isUnselected ? 'text-slate-600' : 'text-white'}`}>
          {ROLE_NAMES[value] || ROLE_NAMES.UNSELECTED}
        </span>
      </div>

      {/* Pop-up do Carrossel de Ícones */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl p-3 z-50 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 bg-black">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {selectableRoles.map(role => (
              <div 
                key={role}
                onClick={() => { onChange(role); setIsOpen(false); }}
                className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all border ${value === role ? 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black border-white/5 hover:border-white/30 hover:bg-white/10'}`}
                title={ROLE_NAMES[role]}
              >
                <img src={ROLE_ICONS[role]} alt={role} className={`w-6 h-6 transition-all ${value !== role ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-110' : 'scale-110'}`} />
              </div>
            ))}
          </div>
          {/*<div 
            onClick={() => { onChange('UNSELECTED'); setIsOpen(false); }} 
            className="w-full p-2 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-500/20 text-[9px] font-black tracking-widest uppercase text-center cursor-pointer transition-all"
          >
            Limpar Rota
          </div>*/}
        </div>
      )}
    </div>
  );
};