interface SpellsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpellSlot: 0 | 1;
  setActiveSpellSlot: (slot: 0 | 1) => void;
  selectedSpells: [number, number];
  getSpellImgById: (id: number) => string;
  spellsList: any[];
  handleSpellSelect: (spellId: number) => void;
  ddragonVersion: string;
}

export const SpellsModal = ({
  isOpen, onClose, activeSpellSlot, setActiveSpellSlot, selectedSpells,
  getSpellImgById, spellsList, handleSpellSelect, ddragonVersion
}: SpellsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 lg:p-6 backdrop-blur-xl">
      <div className="glass-card p-6 rounded-[2rem] w-full max-w-sm shadow-2xl animate-fade-in border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-white font-black tracking-widest uppercase">Feitiços</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-3xl transition-colors">&times;</button>
        </div>
        <div className="flex justify-center gap-6 mb-8">
          <div onClick={() => setActiveSpellSlot(0)} className={`w-20 h-20 bg-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all border flex items-center justify-center ${activeSpellSlot === 0 ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-white/10 opacity-50 hover:opacity-100'}`}>
            {selectedSpells[0] > 0 ? <img src={getSpellImgById(selectedSpells[0])} alt="S1" className="w-full h-full object-cover" /> : <span className="text-white/30 font-bold">D</span>}
          </div>
          <div onClick={() => setActiveSpellSlot(1)} className={`w-20 h-20 bg-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all border flex items-center justify-center ${activeSpellSlot === 1 ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-white/10 opacity-50 hover:opacity-100'}`}>
            {selectedSpells[1] > 0 ? <img src={getSpellImgById(selectedSpells[1])} alt="S2" className="w-full h-full object-cover" /> : <span className="text-white/30 font-bold">F</span>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mx-auto place-items-center w-fit">
          {spellsList.map(spell => (
            <div key={spell.key} onClick={() => handleSpellSelect(parseInt(spell.key))} className="cursor-pointer border border-white/5 hover:border-white rounded-xl overflow-hidden transition-all hover:scale-105 shadow-md">
              <img src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/${spell.image.full}`} alt={spell.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};