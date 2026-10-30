import { RoleCarousel } from './roles';
import { ROLE_ICONS, ROLE_NAMES, formatTime } from '../utils/constants';
import { ShinyButton } from '../assets/button';


interface LobbyViewProps {
  summoner: any;
  lobbyData: any;
  searchState: any;
  ddragonVersion: string;
  setShowLobbyModal: (val: boolean) => void;
  socket: any;
}

export const LobbyView = ({
  summoner, lobbyData, searchState, ddragonVersion, setShowLobbyModal, socket
}: LobbyViewProps) => {
  const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${summoner.profileIconId}.png`;
  
  const isLeader = lobbyData?.localMember?.isLeader;
  const isSearching = searchState && searchState.searchState === 'Searching';
  const queueTime = searchState ? formatTime(searchState.timeInQueue) : '00:00';
  const hasPenalty = searchState?.lowPriorityData?.bustedLeaverPenaltyActive;

  const getQueueName = (queueId: number, isCustom: boolean) => {
    if (isCustom) return 'PARTIDA PERSONALIZADA';
    switch(queueId) {
      case 400: return 'NORMAL (ALTERNADA)';
      case 420: return 'RANKED SOLO/DUO';
      case 430: return 'NORMAL (CEGAS)';
      case 440: return 'RANKED FLEX';
      case 450: return 'ARAM';
      case 490: return 'QUICKPLAY';
      default: return 'LOBBY ATIVO';
    }
  };

  return (
    <div className="min-h-screen bg-linear-45 from-[#000000] from-10% via-[#02001418] via-30% to-[#161221] to-90% text-slate-200 p-4 lg:p-6 relative overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto mt-4 lg:mt-10">
        <header className="glass-card rounded-[2rem] p-6 lg:p-8 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 border border-white/10">
          <div className="relative shrink-0">
            <img src={profileIconUrl} alt="Ícone" className="w-24 h-24 lg:w-28 lg:h-28 rounded-full border-2 border-white/20 shadow-lg" />
            <span className="absolute -bottom-2 -right-2 bg-black border border-white/20 text-white text-xs font-black tracking-widest px-3 py-1.5 rounded-full">{summoner.summonerLevel}</span>
          </div>
          
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left justify-center h-full">
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-widest drop-shadow-md">
              {summoner.gameName} <span className="text-slate-500 text-xl font-medium">#{summoner.tagLine}</span>
            </h1>

            {/* Exibição do Elo do Jogador */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${
                summoner.elo && summoner.elo !== 'UNRANKED' 
                  ? 'text-[#c8aa6e] bg-[#c8aa6e]/10 border-[#c8aa6e]/30 shadow-[0_0_10px_rgba(200,170,110,0.2)]' 
                  : 'text-slate-400 bg-white/5 border-white/10'
              }`}>
                {summoner.elo ? summoner.elo.replace('_', ' ') : 'UNRANKED'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3 bg-black px-4 py-2 rounded-full border border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,10)]"></div>
              <span className="text-xs lg:text-sm text-slate-300 font-bold uppercase tracking-[0.2em]">Conectado</span>
            </div>
          </div>
        </header>

        {lobbyData ? (
          <div className="flex flex-col w-full">
            <div className="glass-card p-6 lg:p-10 rounded-[2rem] border border-white/10 flex flex-col items-center shadow-2xl">
              <span className="font-black text-white tracking-[0.4em] uppercase text-xl lg:text-2xl mb-8 text-center">
                {getQueueName(lobbyData?.gameConfig?.queueId, lobbyData?.gameConfig?.isCustom)}
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full text-left">
                {lobbyData?.members?.map((member: any) => {
                  const memberIcon = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${member.summonerIconId}.png`;
                  const isMe = member.summonerId === summoner.summonerId;

                  return (
                    <div key={member.summonerId} className={`glass-card p-4 rounded-2xl border ${isMe ? 'border-white/30 bg-white/5' : 'border-white/5'} flex items-center gap-4`}>
                      <div className="relative">
                        <img src={memberIcon} className="w-12 h-12 rounded-full border border-white/10" />
                        {member.isLeader && <span className="absolute -top-3 -right-3 text-xl drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">👑</span>}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-black text-white text-xs truncate tracking-widest">
                          {member.gameName || member.summonerName} <span className="text-slate-500 font-medium lowercase">#{member.tagLine || 'br1'}</span>
                        </h3>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5 ${member.elo && member.elo !== 'UNRANKED' ? 'text-[#c8aa6e]' : 'text-slate-500'}`}>
                          {member.elo ? member.elo.replace('_', ' ') : 'UNRANKED'}
                        </p>
                        
                        <div className="flex gap-1.5 mt-2">
                          <div className="w-6 h-6 bg-black/40 border border-white/10 rounded-full flex items-center justify-center" title={ROLE_NAMES[member.firstPositionPreference]}>
                            <img src={ROLE_ICONS[member.firstPositionPreference] || ROLE_ICONS.UNSELECTED} className="w-3.5 h-3.5 opacity-80" />
                          </div>
                          <div className="w-6 h-6 bg-black/40 border border-white/10 rounded-full flex items-center justify-center" title={ROLE_NAMES[member.secondPositionPreference]}>
                            <img src={ROLE_ICONS[member.secondPositionPreference] || ROLE_ICONS.UNSELECTED} className="w-3.5 h-3.5 opacity-80" />
                          </div>
                        </div>
                      </div>
                      {isLeader && !isMe && (
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => socket.emit('lol:promote-leader', member.summonerId)} className="text-[10px] bg-white/10 hover:bg-white hover:text-black text-white px-2 py-1 rounded-md transition-colors font-black" title="Passar Liderança">👑</button>
                          <button onClick={() => socket.emit('lol:kick-member', member.summonerId)} className="text-[10px] bg-red-900/30 hover:bg-red-500 text-red-300 px-2 py-1 rounded-md transition-colors font-black" title="Expulsar">X</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col items-center mt-10 w-full gap-5">
                {isSearching ? (
                  <div className="glass-card p-6 rounded-2xl border border-white/20 flex flex-col items-center justify-center w-full max-w-sm">
                    <span className="text-[10px] text-slate-400 font-black tracking-[0.3em] uppercase mb-2">NA FILA</span>
                    <span className="text-4xl font-black text-white tracking-widest">{queueTime}</span>
                    {hasPenalty && <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-3 bg-red-900/20 border border-red-500/20 px-3 py-1.5 rounded-md">Restrição LeaverBuster Ativa</span>}
                  </div>
                ) : (
                  <div className="flex gap-4 w-full max-w-sm">
                    <RoleCarousel 
                      value={lobbyData?.localMember?.firstPositionPreference || 'UNSELECTED'} 
                      onChange={(val) => socket.emit('lol:change-roles', { firstPreference: val, secondPreference: lobbyData.localMember.secondPositionPreference })} 
                      label="PRINCIPAL" 
                    />
                    <RoleCarousel 
                      value={lobbyData?.localMember?.secondPositionPreference || 'UNSELECTED'} 
                      onChange={(val) => socket.emit('lol:change-roles', { firstPreference: lobbyData.localMember.firstPositionPreference, secondPreference: val })} 
                      label="SECUNDÁRIA" 
                    />
                  </div>
                )}

                {isLeader ? (
                  <ShinyButton 
                    onClick={() => isSearching ? socket.emit('lol:stop-queue') : socket.emit('lol:start-queue')}
                    className={`w-full max-w-sm ${isSearching ? '!bg-red-950/80 border-red-500/50 text-red-300' : ''}`}
                  >
                    {isSearching ? 'CANCELAR' : 'COMEÇAR'}
                  </ShinyButton>
                ) : (
                  !isSearching && <div className="w-full max-w-sm py-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-center text-xs font-black uppercase tracking-widest mt-2">Aguardando o Líder</div>
                )}
                
                <button onClick={() => socket.emit('lol:leave-lobby')} className="w-full max-w-sm py-4 rounded-4xl font-black uppercase cursor-pointer tracking-[0.2em] transition-all text-[10px] bg-transparent border border-red-500 text-red-500 hover:scale-105">
                  Sair
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full max-w-sm">
            <ShinyButton 
              onClick={() => setShowLobbyModal(true)}
              className="w-full"
            >
              Jogar
            </ShinyButton>
          </div>
        )}
      </div>
    </div>
  );
};