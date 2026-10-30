import { STAT_SHARDS } from '../utils/constants';

interface RunesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditingRune: boolean;
  setIsEditingRune: (val: boolean) => void;
  runePages: any[];
  startCreatingRune: () => void;
  selectRunePage: (id: number) => void;
  startEditingRune: (id: number) => void;
  primaryTree: any;
  subTree: any;
  runeName: string;
  setRuneName: (val: string) => void;
  runesReforged: any[];
  primaryStyle: number;
  setPrimaryStyle: (val: number) => void;
  handlePerkSelect: (perkId: number, rowPerks: any[]) => void;
  selectedPerks: number[];
  subStyle: number;
  setSubStyle: (val: number) => void;
  handleSecondarySelect: (runeId: number, rowRunes: any[], subTreeRef: any) => void;
  saveRunePage: () => void;
}

export const RunesModal = ({
  isOpen, onClose, isEditingRune, setIsEditingRune, runePages, startCreatingRune, selectRunePage, startEditingRune,
  primaryTree, subTree, runeName, setRuneName, runesReforged, primaryStyle, setPrimaryStyle, handlePerkSelect,
  selectedPerks, subStyle, setSubStyle, handleSecondarySelect, saveRunePage
}: RunesModalProps) => {
  if (!isOpen) return null;

  // Normalização defensiva para garantir que as páginas apareçam sempre
  const resolvedPages = Array.isArray(runePages) 
    ? runePages 
    : (runePages as any)?.data || (runePages as any)?.pages || [];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-2 lg:p-6 backdrop-blur-xl">
      <div className="glass-card p-4 lg:p-6 rounded-[2rem] w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl animate-fade-in border border-white/10">
        <div className="flex justify-between items-center mb-4 lg:mb-6 shrink-0 border-b border-white/10 pb-4">
          <h2 className="text-xl lg:text-2xl text-white font-black tracking-widest uppercase">Runas</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-3xl transition-colors cursor-pointer">&times;</button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 overflow-hidden">
          <div className={`w-full lg:w-1/3 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2 ${isEditingRune ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Suas Páginas</h3>
              <button onClick={startCreatingRune} className="text-xs bg-white/5 text-slate-300 px-4 py-1.5 rounded-full hover:bg-white hover:text-black border border-white/10 transition-all font-bold tracking-widest uppercase cursor-pointer">+ Nova</button>
            </div>
            {resolvedPages.map((page: any) => {
              const pageId = page.id;
              const pageName = page.name || 'Página Sem Nome';
              const isCurrent = page.current ?? page.isCurrent ?? false;
              const isEditable = page.isEditable ?? page.editable ?? true;

              return (
                <div key={pageId} className={`flex rounded-xl border transition-all ${isCurrent ? 'bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-black/20 border-white/5 hover:border-white/20'}`}>
                  <button 
                    onClick={() => {
                      selectRunePage(pageId);
                      startEditingRune(pageId);
                    }} 
                    className="flex-1 p-4 text-left group cursor-pointer"
                  >
                    <div className={`font-bold text-sm lg:text-lg truncate max-w-[200px] transition-colors ${isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{pageName}</div>
                    <div className="text-[10px] mt-1 text-slate-500 font-bold uppercase tracking-widest">{isCurrent ? 'Ativa' : 'Equipar'}</div>
                  </button>
                  {isEditable && (
                    <button onClick={() => startEditingRune(pageId)} className="px-4 border-l border-white/10 hover:bg-white hover:text-black text-slate-400 transition-all flex items-center justify-center rounded-r-xl cursor-pointer" title="Editar">
                      ✏️
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {primaryTree && subTree ? (
            <div className="flex-1 bg-black/40 rounded-[1.5rem] border border-white/10 p-4 lg:p-6 overflow-y-auto custom-scrollbar flex flex-col relative">
              <input value={runeName} onChange={e => setRuneName(e.target.value)} className="bg-transparent text-xl lg:text-2xl font-black text-white tracking-wider border-b border-white/20 focus:border-white focus:outline-none mb-6 w-full pb-2" />
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-4 sm:pr-4">
                  <div className="flex justify-center gap-2 mb-2 lg:mb-4">
                    {runesReforged.map(tree => (
                      <img key={tree.id} src={`https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`} onClick={() => setPrimaryStyle(tree.id)} className={`w-8 h-8 lg:w-10 lg:h-10 cursor-pointer rounded-full border-2 ${primaryStyle === tree.id ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-30 hover:opacity-100 grayscale'}`} alt="tree" />
                    ))}
                  </div>
                  {primaryTree.slots.map((slot: any, i: number) => (
                    <div key={i} className="flex justify-center gap-3 lg:gap-4">
                      {slot.runes.map((rune: any) => (
                        <img key={rune.id} src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`} onClick={() => handlePerkSelect(rune.id, slot.runes)} className={`cursor-pointer rounded-full border-2 transition-all ${i === 0 ? 'w-12 h-12 lg:w-14 lg:h-14' : 'w-10 h-10 lg:w-12 lg:h-12'} ${selectedPerks.includes(rune.id) ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-110 grayscale-0' : 'border-transparent opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`} alt="rune" />
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex flex-col gap-4 sm:pl-2">
                  <div className="flex justify-center gap-2 mb-2 lg:mb-4">
                    {runesReforged.filter(t => t.id !== primaryStyle).map(tree => (
                      <img key={tree.id} src={`https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`} onClick={() => setSubStyle(tree.id)} className={`w-7 h-7 lg:w-8 lg:h-8 cursor-pointer rounded-full border-2 ${subStyle === tree.id ? 'border-white' : 'border-transparent opacity-30 hover:opacity-100 grayscale'}`} alt="sub tree" />
                    ))}
                  </div>
                  {subTree.slots.slice(1).map((slot: any, i: number) => (
                    <div key={i} className="flex justify-center gap-3 lg:gap-4">
                      {slot.runes.map((rune: any) => (
                        <img key={rune.id} src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`} onClick={() => handleSecondarySelect(rune.id, slot.runes, subTree)} className={`w-9 h-9 lg:w-10 lg:h-10 cursor-pointer rounded-full border-2 transition-all ${selectedPerks.includes(rune.id) ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110 grayscale-0' : 'border-transparent opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`} alt="secondary rune" />
                      ))}
                    </div>
                  ))}
                  
                  <div className="mt-2 pt-4 flex flex-col gap-3">
                    {STAT_SHARDS.map((row, i) => (
                      <div key={i} className="flex justify-center gap-3 lg:gap-4">
                        {row.map(stat => (
                          <div 
                            key={stat.id} 
                            onClick={() => handlePerkSelect(stat.id, row)} 
                            className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${selectedPerks.includes(stat.id) ? 'border-white bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/10 opacity-40 hover:opacity-100 bg-black/20'}`}
                          >
                            <img src={`https://ddragon.leagueoflegends.com/cdn/img/perk-images/${stat.icon}`} className="w-4 h-4 lg:w-5 lg:h-5" alt="stat shard" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-8 pt-4 flex justify-end gap-3 lg:gap-4">
                <button onClick={() => setIsEditingRune(false)} className="px-6 py-3 bg-transparent border border-white/10 text-slate-300 rounded-xl hover:bg-white hover:text-black transition-all font-black tracking-widest text-xs uppercase cursor-pointer">Cancelar</button>
                <button onClick={saveRunePage} className="px-8 py-3 bg-white text-black font-black rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)] tracking-widest text-xs uppercase cursor-pointer">Salvar</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};