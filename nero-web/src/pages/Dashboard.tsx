import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { STAT_SHARDS } from '../utils/constants';
import { SpellsModal } from '../components/spells';
import { RunesModal } from '../components/runes';
import { ChampSelectView } from '../components/champSelect';
import { LobbyView } from '../components/lobby';
import { ReadyCheckModal } from '../components/queue';
import { LobbyCreateModal } from '../components/gameMode';
import { LiveGameView } from '../components/inGame';

export function Dashboard() {
  const [summoner, setSummoner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matchFound, setMatchFound] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  
  const [lobbyData, setLobbyData] = useState<any>(null);
  const [searchState, setSearchState] = useState<any>(null);
  
  const [champSelect, setChampSelect] = useState<any>(null);
  const [championsList, setChampionsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ddragonVersion, setDdragonVersion] = useState<string>('16.16.1');

  const [spellsList, setSpellsList] = useState<any[]>([]);
  const [showSpellsModal, setShowSpellsModal] = useState(false);
  const [selectedSpells, setSelectedSpells] = useState<[number, number]>([0, 0]);
  const [activeSpellSlot, setActiveSpellSlot] = useState<0 | 1>(0);

  const [runePages, setRunePages] = useState<any[]>([]);
  const [runesReforged, setRunesReforged] = useState<any[]>([]);
  const [showRunesModal, setShowRunesModal] = useState(false);
  const [isEditingRune, setIsEditingRune] = useState(false);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [runeName, setRuneName] = useState('Página Nero');
  const [primaryStyle, setPrimaryStyle] = useState<number>(8100);
  const [subStyle, setSubStyle] = useState<number>(8000);
  const [selectedPerks, setSelectedPerks] = useState<number[]>([]);

  const [carouselSkins, setCarouselSkins] = useState<any[]>([]);
  const [activeSkinId, setActiveSkinId] = useState<number>(0);

  const [inGame, setInGame] = useState(false);
  const [liveGameData, setLiveGameData] = useState<any>(null);
  const [lastQueueId, setLastQueueId] = useState<number>(420);

  const [readyCheckTimer, setReadyCheckTimer] = useState({ timeLeft: 0, totalTime: 12 });

  // 1. Conexão do Socket
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  // 2. Busca Inicial de Dados Estáticos
  useEffect(() => {
    async function fetchStaticData() {
      try {
        const resSummoner = await api.get('/api/summoner');
        if (resSummoner.data.success) setSummoner(resSummoner.data.data);
        
        const resVersions = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await resVersions.json();
        const latestVersion = versions[0];
        setDdragonVersion(latestVersion);

        const resChamps = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/pt_BR/champion.json`);
        const dataChamps = await resChamps.json();
        setChampionsList(Object.values(dataChamps.data));

        const resSpells = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/pt_BR/summoner.json`);
        const dataSpells = await resSpells.json();
        setSpellsList(Object.values(dataSpells.data).filter((s: any) => s.modes.includes('CLASSIC')));

        const resRunes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/pt_BR/runesReforged.json`);
        const dataRunes = await resRunes.json();
        setRunesReforged(dataRunes);
      } catch (error) {
        console.error('Erro ao carregar dados estáticos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStaticData();
  }, []);

  // 3. MASTER LOOP: Sincronização contínua de todas as fases
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const phaseRes = await api.get('/api/gameflow');
        if (!phaseRes.data.success) return;
        const phase = phaseRes.data.phase;

        if (phase === 'Lobby' || phase === 'Matchmaking') {
          setInGame(false); setChampSelect(null); setMatchFound(false);
          const res = await api.get('/api/lobby');
          if (res.data.success && res.data.data) {
            setLobbyData(res.data.data);
            setSearchState(res.data.data.searchState || (phase === 'Matchmaking' ? { searchState: 'Searching' } : null));
            if (res.data.data.gameConfig?.queueId) setLastQueueId(res.data.data.gameConfig.queueId);
          } else {
            setLobbyData(null); 
            setSearchState(null);
          }
        }
        else if (phase === 'ReadyCheck') {
          setChampSelect(null);
          setMatchFound(true);
          try {
            const res = await api.get('/api/ready-check');
            if (res.data.success && res.data.data) {
              setReadyCheckTimer({ timeLeft: res.data.data.timer, totalTime: 12 });
            }
          } catch(e) {}
        }
        else if (phase === 'ChampSelect') {
          setMatchFound(false);
          const res = await api.get('/api/champ-select');
          if (res.data.success && res.data.data) {
            setChampSelect(res.data.data);
            const me = res.data.data.myTeam?.find((p: any) => p.cellId === res.data.data.localPlayerCellId);
            if (me) {
              setSelectedSpells(prev => (prev[0] === 0 && prev[1] === 0) ? [me.spell1Id, me.spell2Id] : prev);
            }

            // Carrega as runas em segundo plano 1x se a lista estiver vazia para o ícone no topo aparecer de imediato
            if (runePages.length === 0) {
              api.get('/api/runes').then(rRes => {
                if (rRes.data.success && Array.isArray(rRes.data.data)) {
                  setRunePages(rRes.data.data);
                  const activePage = rRes.data.data.find((p: any) => p.current || p.isCurrent) || rRes.data.data[0];
                  if (activePage) {
                    const perks = activePage.selectedPerkIds || activePage.perks || [];
                    if (perks.length > 0) setSelectedPerks(perks);
                  }
                }
              }).catch(() => {});
            }
          }
        }
        else if (phase === 'InProgress') {
          setChampSelect(null); 
          setMatchFound(false); 
          setInGame(true);
          const res = await api.get('/api/live-game');
          if (res.data.success && res.data.data) {
            setLiveGameData(res.data.data);
          }
        }
        else if (phase === 'EndOfGame' || phase === 'PreEndOfGame') {
           setInGame(false); setChampSelect(null);
           try { socket.emit('lol:create-lobby', lastQueueId); } catch(e) {}
        }
        else {
          setMatchFound(false); 
          setChampSelect(null); 
          setInGame(false);
        }
      } catch (error) {
        // Ignora erros momentâneos de rede local
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [lastQueueId, runePages.length]);

  const acceptMatch = () => { socket.emit('lol:accept-match'); setMatchFound(false); };
  const declineMatch = () => { socket.emit('lol:decline-match'); setMatchFound(false); };

  const activeAction = useMemo(() => {
    if (!champSelect) return null;
    for (const phase of champSelect.actions || []) {
      for (const action of phase) {
        if (action.actorCellId === champSelect.localPlayerCellId && action.isInProgress) return action;
      }
    }
    return null;
  }, [champSelect]);

  const isMyTurn = !!activeAction;
  const isBanPhase = activeAction?.type === 'ban';
  const hoveredChampionId = activeAction?.championId || 0;
  
  const myPlayerInfo = champSelect?.myTeam?.find((p: any) => p.cellId === champSelect.localPlayerCellId);
  const isLockedIn = (myPlayerInfo?.championId || 0) > 0;

  useEffect(() => {
    if (isLockedIn) {
      api.get('/api/skins').then(res => {
        if (res.data.success) {
          setCarouselSkins(res.data.data);
          const currentSkin = res.data.data.find((s: any) => s.selected);
          if (currentSkin) setActiveSkinId(currentSkin.id);
        }
      }).catch(console.error);
    } else {
      setCarouselSkins([]);
    }
  }, [isLockedIn]);

  const handleHoverChampion = (numericChampId: number) => {
    if (!activeAction || isLockedIn) return;
    socket.emit('lol:champ-select-action', { actionId: activeAction.id, championId: numericChampId, completed: false });
  };

  const handleLockIn = () => {
    if (!activeAction || hoveredChampionId === 0) return;
    socket.emit('lol:champ-select-action', { actionId: activeAction.id, championId: hoveredChampionId, completed: true });
  };

  const handleSpellSelect = (spellId: number) => {
    const newSpells: [number, number] = [...selectedSpells];
    newSpells[activeSpellSlot] = spellId;
    setSelectedSpells(newSpells);
    socket.emit('lol:change-spells', { spell1Id: newSpells[0], spell2Id: newSpells[1] });
    
    if (activeSpellSlot === 0) setActiveSpellSlot(1);
    else { setActiveSpellSlot(0); setShowSpellsModal(false); }
  };

  const openRunesModal = async () => {
    try {
      const res = await api.get('/api/runes');
      if (res.data.success && Array.isArray(res.data.data)) {
        const pages = res.data.data;
        setRunePages(pages);
        
        // Sincroniza a página ativa imediatamente para o ícone e a lista ficarem perfeitos
        const activePage = pages.find((p: any) => p.current || p.isCurrent) || pages[0];
        if (activePage) {
          const perks = activePage.selectedPerkIds || activePage.perks || [];
          const primary = activePage.primaryStyleId || activePage.primaryStyle;
          const sub = activePage.subStyleId || activePage.subStyle;

          if (perks.length > 0) setSelectedPerks(perks);
          if (primary) setPrimaryStyle(primary);
          if (sub) setSubStyle(sub);
        }

        setShowRunesModal(true);
      }
    } catch (error) {
      alert('Erro ao carregar runas. Verifique a conexão com o PC.');
    }
  };

  const selectRunePage = (pageId: number) => {
    socket.emit('lol:change-rune-page', pageId);
    
    setRunePages(prev => prev.map(p => ({ ...p, current: p.id === pageId })));

    const targetPage = runePages.find(p => p.id === pageId);
    if (targetPage) {
      const perks = targetPage.selectedPerkIds || targetPage.perks || [];
      const primary = targetPage.primaryStyleId || targetPage.primaryStyle;
      const sub = targetPage.subStyleId || targetPage.subStyle;

      if (perks.length > 0) setSelectedPerks(perks);
      if (primary) setPrimaryStyle(primary);
      if (sub) setSubStyle(sub);
    }
  };

  const startCreatingRune = () => {
    setEditingPageId(null);
    setRuneName('Página Nero');
    setPrimaryStyle(8100);
    setSubStyle(8000);
    setSelectedPerks([8112, 8143, 8138, 8105, 9111, 8014, 5008, 5008, 5001]);
    setIsEditingRune(true);
  };

  const startEditingRune = (pageId: number) => {
    const page = runePages.find(p => p.id === pageId);
    if (page) {
      setEditingPageId(page.id);
      setRuneName(page.name);
      setPrimaryStyle(page.primaryStyleId);
      setSubStyle(page.subStyleId);
      setSelectedPerks(page.selectedPerkIds || []);
      setIsEditingRune(true);
    }
  };

  const handlePerkSelect = (perkId: number, rowPerks: any[]) => {
    const rowIds = rowPerks.map(p => p.id);
    const newPerks = selectedPerks.filter(id => !rowIds.includes(id));
    newPerks.push(perkId);
    setSelectedPerks(newPerks);
  };

  const handleSecondarySelect = (runeId: number, rowRunes: any[], subTreeRef: any) => {
    const rowIds = rowRunes.map(r => r.id);
    let newPerks = selectedPerks.filter(id => !rowIds.includes(id));
    const subTreeRuneIds = subTreeRef.slots.flatMap((s:any) => s.runes.map((r:any) => r.id));
    const currentSubPerks = newPerks.filter(id => subTreeRuneIds.includes(id));
    
    if (currentSubPerks.length >= 2) newPerks = newPerks.filter(id => id !== currentSubPerks[0]);
    newPerks.push(runeId);
    setSelectedPerks(newPerks);
  };

  const saveRunePage = () => {
    const orderedPerks: number[] = [];
    const primaryTree = runesReforged.find(r => r.id === primaryStyle);
    const subTree = runesReforged.find(r => r.id === subStyle);

    primaryTree?.slots.forEach((slot: any) => {
      const selected = slot.runes.find((r: any) => selectedPerks.includes(r.id));
      orderedPerks.push(selected ? selected.id : slot.runes[0].id);
    });

    let secondaryCount = 0;
    subTree?.slots.slice(1).forEach((slot: any) => {
      const selected = slot.runes.find((r: any) => selectedPerks.includes(r.id));
      if (selected && secondaryCount < 2) { orderedPerks.push(selected.id); secondaryCount++; }
    });
    if (secondaryCount < 2) {
      subTree?.slots.slice(1).forEach((slot: any) => {
        if (secondaryCount < 2) {
          const hasSelection = slot.runes.some((r: any) => orderedPerks.includes(r.id));
          if (!hasSelection) { orderedPerks.push(slot.runes[0].id); secondaryCount++; }
        }
      });
    }

    STAT_SHARDS.forEach(row => {
      const selected = row.find(s => selectedPerks.includes(s.id));
      orderedPerks.push(selected ? selected.id : row[0].id);
    });

    socket.emit('lol:save-rune-page', {
      pageId: editingPageId, name: runeName, primaryStyleId: primaryStyle, subStyleId: subStyle, selectedPerkIds: orderedPerks
    });
    setIsEditingRune(false);
    setTimeout(() => { openRunesModal(); }, 1000);
  };

  const filteredChampions = useMemo(() => championsList.filter(champ => champ.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, championsList]);

  const getChampStringId = (numId: number) => {
    const champ = championsList.find(c => parseInt(c.key) === numId);
    return champ ? champ.id : '';
  };

  const getChampImgById = (id: number) => {
    if (id === 0) return '';
    const champ = championsList.find(c => parseInt(c.key) === id);
    return champ ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champ.id}.png` : '';
  };

  const getSpellImgById = (id: number) => {
    if (id === 0) return '';
    const spell = spellsList.find(s => parseInt(s.key) === id);
    return spell ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/${spell.image.full}` : '';
  };

  if (loading) return <div className="min-h-screen bg-[#000000] flex items-center justify-center text-white font-black tracking-widest uppercase">Carregando...</div>;
  
  if (!summoner) {
    return (
      <div className="relative min-h-screen bg-linear-45 from-[#000000] from-10% via-[#02001418] via-30% to-[#000425] to-90% flex items-center justify-center p-4 overflow-hidden antialiased select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col items-center max-w-md w-full text-center space-y-6 z-10">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-500/90 mb-2 backdrop-blur-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="absolute inset-0 bg-red-500/5 blur-md rounded-2xl -z-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold cursor-auto text-zinc-100 tracking-tight">
              Conexão Perdida
            </h1>
            <p className="text-sm font-normal text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
              Não conseguimos estabelecer comunicação com o seu computador ou o League.
            </p>
          </div>

          <button 
            onClick={() => {
              sessionStorage.removeItem('nero_auth_token');
              window.location.reload();
            }} 
            className="group relative flex items-center cursor-pointer justify-center px-6 py-2.5 bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/80 text-zinc-400 hover:text-zinc-200 rounded-xl font-medium text-xs uppercase tracking-widest transition-all duration-200 active:scale-98 backdrop-blur-xs shadow-sm hover:shadow-md"
          >
            Voltar ao ínicio
          </button>
        </div>
      </div>
    );
  }

  const primaryTree = runesReforged.find(r => r.id === primaryStyle);
  const subTree = runesReforged.find(r => r.id === subStyle);

  const actions = champSelect?.actions || [];
  const myTeamCellIds = (champSelect?.myTeam || []).map((m: any) => m.cellId);

  const displayMyBans: number[] = [];
  const displayTheirBans: number[] = [];

  actions.forEach((row: any[]) => {
    row.forEach((action: any) => {
      if (action.type === 'ban' && action.completed && action.championId > 0) {
        if (myTeamCellIds.includes(action.actorCellId)) {
          displayMyBans.push(action.championId);
        } else {
          displayTheirBans.push(action.championId);
        }
      }
    });
  });

  const activeModals = (
    <>
      <SpellsModal 
        isOpen={showSpellsModal} 
        onClose={() => setShowSpellsModal(false)}
        activeSpellSlot={activeSpellSlot}
        setActiveSpellSlot={setActiveSpellSlot}
        selectedSpells={selectedSpells}
        getSpellImgById={getSpellImgById}
        spellsList={spellsList}
        handleSpellSelect={handleSpellSelect}
        ddragonVersion={ddragonVersion}
      />
      <RunesModal 
        isOpen={showRunesModal}
        onClose={() => { setShowRunesModal(false); setIsEditingRune(false); }}
        isEditingRune={isEditingRune}
        setIsEditingRune={setIsEditingRune}
        runePages={runePages}
        startCreatingRune={startCreatingRune}
        selectRunePage={selectRunePage}
        startEditingRune={startEditingRune}
        primaryTree={primaryTree}
        subTree={subTree}
        runeName={runeName}
        setRuneName={setRuneName}
        runesReforged={runesReforged}
        primaryStyle={primaryStyle}
        setPrimaryStyle={setPrimaryStyle}
        handlePerkSelect={handlePerkSelect}
        selectedPerks={selectedPerks}
        subStyle={subStyle}
        setSubStyle={setSubStyle}
        handleSecondarySelect={handleSecondarySelect}
        saveRunePage={saveRunePage}
      />
      <LobbyCreateModal 
        isOpen={showLobbyModal}
        onClose={() => setShowLobbyModal(false)}
        socket={socket}
      />
      <ReadyCheckModal 
        isOpen={matchFound}
        onAccept={acceptMatch}
        onDecline={declineMatch}
        timerInfo={readyCheckTimer}
      />
    </>
  );

  if (inGame) {
    return (
      <>
        <LiveGameView 
          liveGameData={liveGameData}
          championsList={championsList}
          spellsList={spellsList}
          ddragonVersion={ddragonVersion}
          runesReforged={runesReforged}
        />
        {activeModals}
      </>
    );
  }

  if (champSelect) {
    return (
      <>
        <ChampSelectView 
          champSelect={champSelect}
          myPlayerInfo={myPlayerInfo}
          displayMyBans={displayMyBans}
          displayTheirBans={displayTheirBans}
          getChampImgById={getChampImgById}
          getSpellImgById={getSpellImgById}
          getChampStringId={getChampStringId}
          setShowSpellsModal={setShowSpellsModal}
          setActiveSpellSlot={setActiveSpellSlot}
          openRunesModal={openRunesModal}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredChampions={filteredChampions}
          hoveredChampionId={hoveredChampionId}
          handleHoverChampion={handleHoverChampion}
          isBanPhase={isBanPhase}
          isMyTurn={isMyTurn}
          isLockedIn={isLockedIn}
          handleLockIn={handleLockIn}
          carouselSkins={carouselSkins}
          activeSkinId={activeSkinId}
          setActiveSkinId={setActiveSkinId}
          socket={socket}
          ddragonVersion={ddragonVersion}
          runesReforged={runesReforged}
          selectedPerks={selectedPerks}
        />
        {activeModals}
      </>
    );
  }

  return (
    <>
      <LobbyView 
        summoner={summoner}
        lobbyData={lobbyData}
        searchState={searchState}
        ddragonVersion={ddragonVersion}
        setShowLobbyModal={setShowLobbyModal}
        socket={socket}
      />
      {activeModals}
    </>
  );
}