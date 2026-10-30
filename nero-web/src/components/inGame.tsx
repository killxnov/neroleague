import { ROLE_ICONS } from '../utils/constants';

interface LiveGameViewProps {
  liveGameData: any;
  championsList: any[];
  spellsList: any[];
  ddragonVersion: string;
  runesReforged: any[]; // Agora recebe as runas originais do Data Dragon
}

const POSITION_ORDER: Record<string, number> = {
  'TOP': 1,
  'JUNGLE': 2,
  'MIDDLE': 3,
  'MID': 3,
  'BOTTOM': 4,
  'BOT': 4,
  'UTILITY': 5,
  'SUPPORT': 5,
  'NONE': 6,
  '': 6
};

export const LiveGameView = ({ liveGameData, championsList, spellsList, ddragonVersion, runesReforged }: LiveGameViewProps) => {
  if (!liveGameData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black tracking-widest uppercase">
        Carregando partida em andamento...
      </div>
    );
  }

  // --- LÓGICA TIPO OP.GG PARA ENCONTRAR RUNAS COM 100% DE PRECISÃO ---
  const getPlayerRuneUrls = (player: any) => {
    let keystoneId: number | null = null;
    let subStyleId: number | null = null;

    // 1. Tenta extrair IDs do formato Spectator / LCU Session
    if (player.perks) {
      if (player.perks.perkIds && player.perks.perkIds.length > 0) keystoneId = player.perks.perkIds[0];
      if (player.perks.perkSubStyle) subStyleId = player.perks.perkSubStyle;
    }
    // 2. Tenta extrair IDs do formato Live Client Data API (Porta 2999)
    if (!keystoneId && player.runes) {
      keystoneId = player.runes.keystone?.id;
      subStyleId = player.runes.secondaryRuneTree?.id;
    }
    // 3. Fallbacks genéricos caso o backend já os envie soltos
    if (!keystoneId) keystoneId = player.keystoneId || player.perk0;
    if (!subStyleId) subStyleId = player.subStyleId;

    let primaryUrl = '';
    let secondaryUrl = '';

    // Procura as imagens oficias usando o ID (Exatamente como funciona no Champ Select!)
    if (runesReforged && runesReforged.length > 0) {
      // Procura a Keystone (Pedra-chave)
      if (keystoneId) {
        for (const tree of runesReforged) {
          for (const slot of tree.slots) {
            const foundRune = slot.runes.find((r: any) => r.id === Number(keystoneId));
            if (foundRune) {
              primaryUrl = `https://ddragon.leagueoflegends.com/cdn/img/${foundRune.icon}`;
              break;
            }
          }
          if (primaryUrl) break;
        }
      }
      
      // Procura a Árvore Secundária (Determinação, Feitiçaria, etc.)
      if (subStyleId) {
        const foundTree = runesReforged.find((t: any) => t.id === Number(subStyleId));
        if (foundTree) {
          secondaryUrl = `https://ddragon.leagueoflegends.com/cdn/img/${foundTree.icon}`;
        }
      }
    }

    return { primaryUrl, secondaryUrl };
  };

  const getSpellUrl = (rawSpell: any) => {
    if (!rawSpell) return '';
    let spellVal = typeof rawSpell === 'object' ? (rawSpell.id || rawSpell.displayName || '') : String(rawSpell);
    const strKey = String(spellVal).trim();
    if (!strKey) return '';

    const found = spellsList.find((s: any) => 
      s.id.toLowerCase() === strKey.toLowerCase() || s.key === strKey || s.name.toLowerCase() === strKey.toLowerCase()
    );

    if (found) return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/${found.image.full}`;

    const lower = strKey.toLowerCase();
    if (lower.includes('flash') || strKey === '4') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerFlash.png`;
    if (lower.includes('teleport') || strKey === '12') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerTeleport.png`;
    if (lower.includes('ignite') || lower.includes('dot') || strKey === '14') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerDot.png`;
    if (lower.includes('heal') || strKey === '7') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerHeal.png`;
    if (lower.includes('ghost') || strKey === '6') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerHaste.png`;
    if (lower.includes('smite') || strKey === '11') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerSmite.png`;
    if (lower.includes('barrier') || strKey === '21') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerBarrier.png`;
    if (lower.includes('exhaust') || strKey === '3') return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/SummonerExhaust.png`;

    return '';
  };

  const getChampImg = (champName: string) => {
    if (!champName) return '';
    let fixedName = champName === 'FiddleSticks' ? 'Fiddlesticks' : champName === 'Wukong' ? 'MonkeyKing' : champName;
    const champ = championsList.find(c => c.id.toLowerCase() === fixedName.toLowerCase() || c.name.toLowerCase() === fixedName.toLowerCase());
    return champ ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champ.id}.png` : '';
  };

  // Ordena a equipa pelas posições (TOP, JUG, MID, BOT, SUPP)
  const sortTeamByLane = (team: any[]) => {
    if (!team) return [];
    return [...team].sort((a, b) => {
      const posA = POSITION_ORDER[(a.position || '').toUpperCase()] || 6;
      const posB = POSITION_ORDER[(b.position || '').toUpperCase()] || 6;
      return posA - posB;
    });
  };

  const formatRiotId = (name: string) => {
    if (!name) return { gameName: 'Invocador', tagLine: '' };
    if (name.includes('#')) {
      const [gameName, tagLine] = name.split('#');
      return { gameName, tagLine: `#${tagLine}` };
    }
    return { gameName: name, tagLine: '' };
  };

  const renderTeamTable = (team: any[], teamName: string, borderColor: string, headerColor: string) => {
    const sortedTeam = sortTeamByLane(team);

    return (
      <div className={`p-4 rounded-2xl border ${borderColor} bg-black/40 backdrop-blur-md flex flex-col gap-2`}>
        <div className="flex justify-between items-center mb-2 px-2">
          <h2 className={`${headerColor} font-black text-xs tracking-widest uppercase`}>{teamName}</h2>
          <span className="text-[10px] text-slate-500 font-bold uppercase">5v5 Summoner's Rift</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {sortedTeam.map((player: any, idx: number) => {
            const { primaryUrl, secondaryUrl } = getPlayerRuneUrls(player);
            
            // Corrige o bug de feitiços repetidos garantindo que lê de fontes isoladas
            let rawSpell1 = player.spell1 || player.spell1Id;
            let rawSpell2 = player.spell2 || player.spell2Id;
            
            if (player.summonerSpells) {
              if (Array.isArray(player.summonerSpells)) {
                if (!rawSpell1) rawSpell1 = player.summonerSpells[0];
                if (!rawSpell2) rawSpell2 = player.summonerSpells[1];
              } else {
                if (!rawSpell1) rawSpell1 = player.summonerSpells.summonerSpellOne;
                if (!rawSpell2) rawSpell2 = player.summonerSpells.summonerSpellTwo;
              }
            }

            const spell1Url = getSpellUrl(rawSpell1);
            const spell2Url = getSpellUrl(rawSpell2);
            
            const { gameName, tagLine } = formatRiotId(player.summonerName || player.riotId);
            const posKey = (player.position || '').toUpperCase();
            const laneIcon = ROLE_ICONS[posKey] || ROLE_ICONS['UNSELECTED'];

            return (
              <div 
                key={player.summonerId || player.summonerName || idx} 
                className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
              >
                {/* Lado Esquerdo: Lane + Campeão + Nome */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 opacity-60 shrink-0">
                    <img src={laneIcon} alt="Lane" className="w-full h-full object-contain" />
                  </div>

                  <div className="relative shrink-0">
                    <img 
                      src={getChampImg(player.championName)} 
                      alt={player.championName} 
                      className="w-10 h-10 rounded-lg border border-white/10 object-cover" 
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-white font-bold text-xs tracking-wide truncate">{gameName}</span>
                      {tagLine && <span className="text-slate-500 text-[10px] font-semibold">{tagLine}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{player.championName}</span>
                  </div>
                </div>

                {/* Lado Direito: Spells + Runas (Layout Estilo OP.GG) */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Feitiços */}
                  <div className="flex gap-1">
                    <div className="w-6 h-6 bg-black/60 rounded border border-white/10 overflow-hidden">
                      {spell1Url && <img src={spell1Url} className="w-full h-full object-cover" alt="S1" />}
                    </div>
                    <div className="w-6 h-6 bg-black/60 rounded border border-white/10 overflow-hidden">
                      {spell2Url && <img src={spell2Url} className="w-full h-full object-cover" alt="S2" />}
                    </div>
                  </div>

                  {/* Runas (Keystone + Secundária) */}
                  <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                      {primaryUrl ? (
                        <img src={primaryUrl} className="w-full h-full object-contain p-0.5 drop-shadow-md" title="Keystone" alt="Runa Primária" />
                      ) : (
                        <div className="w-full h-full bg-white/5 rounded-full" />
                      )}
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden opacity-80">
                      {secondaryUrl ? (
                        <img src={secondaryUrl} className="w-full h-full object-contain p-0.5" title="Secundária" alt="Runa Secundária" />
                      ) : (
                        <div className="w-full h-full bg-white/5 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-45 from-[#05000a] via-[#020014] to-[#00041a] text-slate-200 p-4 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h1 className="text-lg lg:text-xl font-black text-white tracking-[0.2em] uppercase">Partida em Andamento</h1>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Ao Vivo</span>
        </div>
      </div>
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTeamTable(liveGameData.blueTeam, 'Equipe Azul', 'border-blue-500/20', 'text-blue-400')}
        {renderTeamTable(liveGameData.redTeam, 'Equipe Vermelha', 'border-red-500/20', 'text-red-400')}
      </div>
    </div>
  );
};