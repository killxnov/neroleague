import { useState, useEffect } from 'react';
import { ShinyButton } from '../assets/button';

interface ChampSelectViewProps {
  champSelect: any;
  myPlayerInfo: any;
  displayMyBans: number[];
  displayTheirBans: number[];
  getChampImgById: (id: number) => string;
  getSpellImgById: (id: number) => string;
  getChampStringId: (numId: number) => string;
  setShowSpellsModal: (val: boolean) => void;
  setActiveSpellSlot: (slot: 0 | 1) => void;
  openRunesModal: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredChampions: any[];
  hoveredChampionId: number;
  handleHoverChampion: (numericId: number) => void;
  isBanPhase: boolean;
  isMyTurn: boolean;
  isLockedIn: boolean;
  handleLockIn: () => void;
  carouselSkins: any[];
  activeSkinId: number;
  setActiveSkinId: (id: number) => void;
  socket: any;
  ddragonVersion: string;
  selectedPerks?: number[];
  runesReforged?: any[];
}

export const ChampSelectView = ({
  champSelect, myPlayerInfo, displayMyBans, displayTheirBans, getChampImgById,
  getSpellImgById, getChampStringId, setShowSpellsModal, setActiveSpellSlot,
  openRunesModal, searchQuery, setSearchQuery, filteredChampions, hoveredChampionId,
  handleHoverChampion, isBanPhase, isMyTurn, isLockedIn, handleLockIn,
  carouselSkins, activeSkinId, setActiveSkinId, socket, ddragonVersion, selectedPerks, runesReforged
}: ChampSelectViewProps) => {
  const lockedChampStrId = getChampStringId(myPlayerInfo?.championId || 0);

  // --- LÓGICA DO CRONÔMETRO ESTÁVEL E FLUIDO ---
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(30000);

  useEffect(() => {
    if (champSelect?.timer?.adjustedTimeLeftInPhase !== undefined) {
      setLocalTimeLeft(champSelect.timer.adjustedTimeLeftInPhase);
      if (champSelect.timer.totalTimeInPhase) {
        setTotalTime(champSelect.timer.totalTimeInPhase);
      }
    }
  }, [champSelect?.timer?.adjustedTimeLeftInPhase, champSelect?.timer?.totalTimeInPhase]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTimeLeft((prev) => Math.max(0, prev - 200));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const percentage = Math.max(0, Math.min(100, (localTimeLeft / totalTime) * 100));

  // --- IDENTIFICAÇÃO DE QUEM ESTÁ A ESCOLHER/BANIR ATUALMENTE ---
  const getActiveActionForCell = (cellId: number) => {
    if (!champSelect?.actions) return null;
    for (const phase of champSelect.actions) {
      for (const action of phase) {
        if (action.actorCellId === cellId && action.isInProgress) {
          return action;
        }
      }
    }
    return null;
  };

  const timerPhase = champSelect?.timer?.phase;
  let phaseText = 'Fase Final';
  if (timerPhase === 'PLANNING') phaseText = 'Declarar Intenção';
  else if (timerPhase === 'BAN_PICK') phaseText = isBanPhase ? 'Banimentos' : 'Seleção';

  const getLaneIconUrl = (pos: string) => {
    if (!pos) return '';
    const normalized = pos.toUpperCase();
    const map: Record<string, string> = {
      'TOP': 'icon-position-top',
      'JUNGLE': 'icon-position-jungle',
      'MIDDLE': 'icon-position-middle',
      'BOTTOM': 'icon-position-bottom',
      'UTILITY': 'icon-position-utility',
      'SUPPORT': 'icon-position-utility'
    };
    const iconName = map[normalized];
    if (!iconName) return '';
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/${iconName}.png`;
  };

// --- LÓGICA ROBUSTA PARA ENCONTRAR O ÍCONE DA RUNA PRINCIPAL (KEYSTONE) ---
  let activeRuneIcon = '';
  if (runesReforged && runesReforged.length > 0) {
    // 1. Tenta encontrar diretamente nos keystones (slot 0 de qualquer árvore)
    for (const tree of runesReforged) {
      if (tree.slots && tree.slots[0]?.runes) {
        const foundKeystone = tree.slots[0].runes.find((r: any) => selectedPerks?.includes(r.id));
        if (foundKeystone) {
          activeRuneIcon = foundKeystone.icon;
          break;
        }
      }
    }
    
    // 2. Fallback: Se não encontrar no slot 0, procura em qualquer slot da árvore
    if (!activeRuneIcon && selectedPerks && selectedPerks.length > 0) {
      for (const tree of runesReforged) {
        for (const slot of tree.slots || []) {
          const foundRune = slot.runes?.find((r: any) => selectedPerks.includes(r.id));
          if (foundRune) {
            activeRuneIcon = foundRune.icon;
            break;
          }
        }
        if (activeRuneIcon) break;
      }
    }
  }

  return (
    <div className="h-screen bg-linear-45 from-[#200000] from-10% via-[#02001418] via-30% to-[#000425] to-90% text-slate-200 flex flex-col lg:flex-row overflow-hidden font-sans relative">
      
      {/* Coluna Esquerda - Bans Aliados e Time Aliado */}
      <div className="w-full lg:w-1/4 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col shrink-0 relative z-10">
        <div className="p-2 lg:p-4 border-b border-red-500/20 bg-red-900/10 flex items-center justify-center lg:flex-col gap-2">
          <h3 className="text-[9px] lg:text-[10px] text-red-400 font-bold uppercase tracking-[0.2em] lg:mb-2 text-center">Bans Aliados</h3>
          <div className="flex justify-center gap-1.5 lg:gap-2 h-7 lg:h-10">
            {displayMyBans.map((banId: number, i: number) => (
              <div key={i} className="w-7 h-7 lg:w-10 lg:h-10 bg-black/40 border border-red-500/30 rounded-lg lg:rounded-xl overflow-hidden opacity-60 backdrop-blur-md">
                {banId > 0 && <img src={getChampImgById(banId)} alt="ban" className="w-full h-full object-cover grayscale" />}
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Aliados */}
        <div className="flex flex-row lg:flex-col p-2 gap-2 overflow-x-auto custom-scrollbar">
          {(champSelect.myTeam || []).map((player: any) => {
            const displayId = player.championId || player.championPickIntent;
            const isMe = player.cellId === champSelect.localPlayerCellId;
            const laneIconUrl = getLaneIconUrl(player.assignedPosition || player.selectedPosition || '');
            
            const activeAction = getActiveActionForCell(player.cellId);
            const isTurnToAct = !!activeAction;
            const isActionBan = activeAction?.type === 'ban';

            return (
              <div 
                key={player.cellId} 
                className={`flex items-center gap-2 p-2 rounded-xl transition-all relative ${
                  isTurnToAct 
                    ? (isActionBan ? 'bg-red-950/40 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-amber-950/40 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse')
                    : (isMe ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/5')
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 lg:w-16 lg:h-16 bg-black border-2 rounded-full overflow-hidden shadow-lg ${isMe ? 'border-white' : 'border-white/10'}`}>
                    {displayId > 0 && <img src={getChampImgById(displayId)} alt="pick" className={`w-full h-full object-cover ${player.championId ? '' : 'opacity-40 grayscale'}`} />}
                  </div>

                  {laneIconUrl && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 lg:w-6 lg:h-6 bg-black border border-white/20 rounded-full flex items-center justify-center p-0.5 shadow-md">
                      <img src={laneIconUrl} alt="lane" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 w-full">
                  <div className="flex justify-between items-center">
                    <span className={`font-black text-[10px] lg:text-xs tracking-widest uppercase truncate ${isMe ? 'text-white' : 'text-slate-400'}`}>
                      {isMe ? 'VOCÊ' : 'Aliado'}
                    </span>
                    {isTurnToAct && (
                      <span className={`text-[8px] lg:text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded ${isActionBan ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}`}>
                        {isActionBan ? 'Banindo' : 'Escolhendo'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <div className="w-5 h-5 lg:w-6 lg:h-6 bg-black/50 rounded-md overflow-hidden border border-white/10">
                      {player.spell1Id > 0 && <img src={getSpellImgById(player.spell1Id)} alt="S1" className="w-full h-full object-cover" />}
                    </div>
                    <div className="w-5 h-5 lg:w-6 lg:h-6 bg-black/50 rounded-md overflow-hidden border border-white/10">
                      {player.spell2Id > 0 && <img src={getSpellImgById(player.spell2Id)} alt="S2" className="w-full h-full object-cover" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centro - Grid de Campeões, Skins e Barra de Ações */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        <div className="p-3 lg:p-4 flex justify-between items-center gap-2 relative z-30 pointer-events-auto">
          
          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={() => { setShowSpellsModal(true); setActiveSpellSlot(0); }} 
              className="w-10 h-10 lg:w-12 lg:h-12 bg-black/70 border-2 border-white/20 hover:border-white rounded-xl overflow-hidden shadow-lg transition-all cursor-pointer flex items-center justify-center"
              title="Trocar Feitiço 1"
            >
              {myPlayerInfo?.spell1Id > 0 ? (
                <img src={getSpellImgById(myPlayerInfo.spell1Id)} alt="Spell 1" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-white/50 font-bold">S1</span>
              )}
            </button>

            <button 
              type="button"
              onClick={() => { setShowSpellsModal(true); setActiveSpellSlot(1); }} 
              className="w-10 h-10 lg:w-12 lg:h-12 bg-black/70 border-2 border-white/20 hover:border-white rounded-xl overflow-hidden shadow-lg transition-all cursor-pointer flex items-center justify-center"
              title="Trocar Feitiço 2"
            >
              {myPlayerInfo?.spell2Id > 0 ? (
                <img src={getSpellImgById(myPlayerInfo.spell2Id)} alt="Spell 2" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-white/50 font-bold">S2</span>
              )}
            </button>
          </div>
          
          <div className="text-center flex-1 px-1 overflow-hidden pointer-events-none">
            <h2 className="text-xs lg:text-xl font-black uppercase tracking-[0.1em] text-white truncate">
              {isLockedIn ? 'Preparação Final' : (isBanPhase ? 'Bana seu Campeão' : (isMyTurn ? 'Escolha seu Campeão' : 'Aguardando...'))}
            </h2>
          </div>

          <button 
            type="button"
            onClick={openRunesModal} 
            className="w-20 h-20 lg:w-12 lg:h-12 border-2 border-white/20 hover:border-white rounded-full overflow-hidden shadow-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Configurar Runas"
          >
            {activeRuneIcon ? (
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/img/${activeRuneIcon}`} 
                alt="Runa Principal" 
                className="w-full h-full object-contain p-1.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
              />
            ) : (
              <span className="text-white/50 text-xs lg:text-sm font-bold opacity-70">📖</span>
            )}
          </button>
        </div>

        {/* Barrinha de Tempo de Seleção Suave */}
        <div className="w-full flex flex-col items-center justify-center gap-1.5 mt-1 px-6">
          <span className="text-[10px] text-white/50 tracking-widest uppercase font-bold">{phaseText}</span>
          <div className="w-full max-w-xl h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#e0bf69] rounded-full transition-all duration-200 ease-linear shadow-[0_0_10px_rgba(10,200,185,0.5)]" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-3 lg:p-4 relative">
          {!isLockedIn ? (
            <>
              <input type="text" placeholder="BUSCAR CAMPEÃO..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full max-w-md mx-auto glass-input text-slate-300 p-2.5 mb-4 focus:border-slate-500/50 outline-none rounded-xl text-center font-bold tracking-widest uppercase text-xs placeholder:text-slate-500/50" />
              <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 justify-center">
                  {filteredChampions.map((champ) => {
                    const numericId = parseInt(champ.key);
                    const isSelected = numericId === hoveredChampionId;
                    return (
                      <div key={champ.key} onClick={() => handleHoverChampion(numericId)} className={`relative cursor-pointer transition-all border-2 rounded-xl aspect-square overflow-hidden ${isSelected ? (isBanPhase ? 'border-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]') : 'border-transparent hover:border-white/30 opacity-60 hover:opacity-100'}`}>
                        <img src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champ.id}.png`} alt={champ.name} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in w-full px-2">
              <h3 className="text-xs lg:text-lg text-slate-400 mb-4 tracking-[0.3em] uppercase font-black">Skins Disponíveis</h3>
              
              <div className="flex gap-4 overflow-x-auto w-full max-w-5xl p-2 snap-x justify-start lg:justify-center custom-scrollbar pb-4 items-center h-[340px] lg:h-[380px]">
                {carouselSkins.length === 0 ? (
                  <div className="text-slate-600 animate-pulse font-bold tracking-widest uppercase text-xs">Decodificando Inventário...</div>
                ) : (
                  carouselSkins
                    .filter(skin => skin.ownership && skin.ownership.owned === true)
                    .map(skin => {
                      const skinIndex = skin.id % 1000;
                      const imgUrl = lockedChampStrId ? `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${lockedChampStrId}_${skinIndex}.jpg` : '';
                      const isSelected = activeSkinId === skin.id;

                      return (
                        <div 
                          key={skin.id} 
                          onClick={() => { setActiveSkinId(skin.id); socket.emit('lol:change-skin', skin.id); }}
                          className={`w-36 h-64 lg:w-44 lg:h-80 rounded-xl shrink-0 snap-center cursor-pointer transition-all border-2 relative overflow-hidden flex flex-col justify-end shadow-lg
                            ${isSelected ? 'border-white scale-105 shadow-[0_0_25px_rgba(255,255,255,0.25)] z-10' : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/40'}
                          `}
                        >
                          <img src={imgUrl} alt={skin.name} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="relative z-10 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-3 pt-12 text-center backdrop-blur-[2px]">
                            <span className={`font-black text-[11px] lg:text-xs tracking-wider uppercase truncate block drop-shadow-md ${isSelected ? 'text-white' : 'text-slate-400'}`}>{skin.name}</span>
                            {isSelected && <span className="text-teal-400 text-[8px] font-bold uppercase mt-1 block tracking-[0.2em] animate-pulse">Equipada</span>}
                          </div>
                        </div>
                      )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {!isLockedIn && (
          <div className="p-3 lg:p-4">
            <ShinyButton onClick={handleLockIn} disabled={!isMyTurn || hoveredChampionId === 0} className={`w-full py-3.5 lg:py-4 text-xs lg:text-lg font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl ${!isMyTurn || hoveredChampionId === 0 ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5' : isBanPhase ? 'bg-red-900/40 text-red-200 border border-red-500/50 hover:bg-red-600 hover:text-white' : 'bg-[#000000] text-black border border-white/5 hover:bg-[#08a69a] hover:shadow-[0_0_30px_rgba(10,200,185,0.3)]'}`}>
              {isBanPhase ? 'Banir' : 'Confirmar'}
            </ShinyButton>
          </div>
        )}
      </div>

      {/* Coluna Direita - Bans Inimigos e Time Inimigo */}
      <div className="w-full lg:w-1/4 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shrink-0 relative z-10">
        <div className="p-2 lg:p-4 border-b border-red-500/20 bg-red-900/10 flex items-center justify-center lg:flex-col gap-2">
          <h3 className="text-[9px] lg:text-[10px] text-red-400 font-bold uppercase tracking-[0.2em] lg:mb-2 text-center">Bans Inimigos</h3>
          <div className="flex justify-center gap-1.5 lg:gap-2 h-7 lg:h-10">
            {displayTheirBans.map((banId: number, i: number) => (
              <div key={i} className="w-7 h-7 lg:w-10 lg:h-10 bg-black/40 border border-red-500/30 rounded-lg lg:rounded-xl overflow-hidden opacity-60 backdrop-blur-md">
                {banId > 0 && <img src={getChampImgById(banId)} alt="ban" className="w-full h-full object-cover grayscale" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-row lg:flex-col p-2 gap-2 overflow-x-auto custom-scrollbar" style={{ justifyContent: 'center' }}>
          {(champSelect.theirTeam || []).map((player: any) => {
            const displayId = player.championId || player.championPickIntent;
            
            const activeAction = getActiveActionForCell(player.cellId);
            const isTurnToAct = !!activeAction;
            const isActionBan = activeAction?.type === 'ban';

            return (
              <div 
                key={player.cellId} 
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  isTurnToAct 
                    ? (isActionBan ? 'bg-red-950/40 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-amber-950/40 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse')
                    : 'bg-white/5 border border-white/5'
                }`}
              >
                <div className="w-10 h-10 lg:w-16 lg:h-16 bg-black border-2 border-white/10 rounded-full overflow-hidden shrink-0 shadow-lg opacity-80">
                  {displayId > 0 && <img src={getChampImgById(displayId)} alt="pick" className="w-full h-full object-cover" />}
                </div>
                <div className="flex flex-col flex-1 w-full">
                  <div className="flex justify-between items-center">
                    {/*<span className="font-black tracking-widest uppercase text-[10px] lg:text-xs text-slate-500 truncate">Inimigo</span>*/}
                    {isTurnToAct && (
                      <span className={`text-[8px] lg:text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded ${isActionBan ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}`}>
                        {isActionBan ? 'Banindo' : 'Escolhendo'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};