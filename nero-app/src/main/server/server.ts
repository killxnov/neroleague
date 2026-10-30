import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import axios from 'axios';
import https from 'https';
import crypto from 'crypto';
import path from 'path';
import { app as electronApp } from 'electron';

export class NeroServer {
  private app = express();
  private httpServer = createServer(this.app);
  private io: Server;
  private sessionPIN: string;
  private lcuConfig: { port: string; token: string } | null = null;
  private memberCache: Record<string, { gameName: string, tagLine: string, elo: string }> = {};
  private activeTokens = new Set<string>();
  
  private gameflowPollInterval: any = null;
  private lastPhase: string = '';
  
  public emitToClient(event: string, data: any) {
    this.io.emit(event, data);
  }

  private axiosInstance = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
  });

  constructor(pin: string) {
    this.sessionPIN = pin;
    this.io = new Server(this.httpServer, { cors: { origin: '*' } });
    this.setupMiddlewares();
    this.setupSocketEvents();
  }

  private setupMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());

    this.app.use('/api', (req, res, next) => {
      if (req.path === '/auth') return next();
      const token = req.headers.authorization?.split(' ')[1];
      if (!token || !this.activeTokens.has(token)) {
        return res.status(401).json({ success: false, message: 'Acesso Negado ou Sessão Expirada' });
      }
      next();
    });

    this.app.post('/api/auth', (req, res) => {
      const { pin } = req.body;
      if (pin === this.sessionPIN) {
        const token = crypto.randomUUID();
        this.activeTokens.add(token);
        res.json({ success: true, message: 'Autenticado', token });
      } else {
        res.status(401).json({ success: false, message: 'PIN incorreto' });
      }
    });

    this.app.post('/api/verify', (req, res) => res.json({ success: true }));

    this.app.get('/api/summoner', async (req, res) => {
      if (!this.lcuConfig) return res.status(503).json({ success: false });
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const response = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-summoner/v1/current-summoner`, { headers: { Authorization: `Basic ${auth}` } });
        res.json({ success: true, data: response.data });
      } catch (error) { res.status(500).json({ success: false }); }
    });

    this.app.get('/api/runes', async (req, res) => {
      if (!this.lcuConfig) return res.status(503).json({ success: false });
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const response = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-perks/v1/pages`, { headers: { Authorization: `Basic ${auth}` } });
        res.json({ success: true, data: response.data });
      } catch (error) { res.status(500).json({ success: false }); }
    });

    this.app.get('/api/skins', async (req, res) => {
      if (!this.lcuConfig) return res.status(503).json({ success: false });
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const response = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-champ-select/v1/skin-carousel-skins`, { headers: { Authorization: `Basic ${auth}` } });
        res.json({ success: true, data: response.data });
      } catch (error) { res.status(500).json({ success: false }); }
    });

    // ENDPOINTS DE SINCRONIZAÇÃO DE ESTADO
    this.app.get('/api/gameflow', async (req, res) => {
      if (!this.lcuConfig) return res.status(503).json({ success: false });
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const response = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-gameflow/v1/gameflow-phase`, { headers: { Authorization: `Basic ${auth}` } });
        res.json({ success: true, phase: response.data });
      } catch (error) { res.status(500).json({ success: false }); }
    });

    this.app.get('/api/champ-select', async (req, res) => {
      if (!this.lcuConfig) return res.status(503).json({ success: false });
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const response = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-champ-select/v1/session`, { headers: { Authorization: `Basic ${auth}` } });
        res.json({ success: true, data: response.data });
      } catch (error) { res.status(500).json({ success: false }); }
    });

    this.app.get('/api/live-game', async (req, res) => {
      try {
        const liveResponse = await axios.get('https://127.0.0.1:2999/liveclientdata/allgamedata', {
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        const data = liveResponse.data;
        
        const formatPlayer = (p: any) => {
          let champName = p.championName || 'Aatrox';
          champName = champName.replace(/['\s.]/g, '');
          if (champName.toLowerCase() === 'fiddlesticks') champName = 'Fiddlesticks';
          if (champName.toLowerCase() === 'monkeyking' || champName.toLowerCase() === 'wukong') champName = 'MonkeyKing';

          const getSpellName = (spellObj: any) => {
            if (!spellObj) return 'SummonerFlash';
            const id = String(spellObj.id || '');
            if (id.startsWith('Summoner')) return id;
            
            const name = String(spellObj.displayName || '').toLowerCase();
            const map: Record<string, string> = {
              'flash': 'SummonerFlash', 'ghost': 'SummonerHaste', 'heal': 'SummonerHeal', 'curar': 'SummonerHeal',
              'ignite': 'SummonerDot', 'incendiar': 'SummonerDot', 'teleport': 'SummonerTeleport', 'teletransporte': 'SummonerTeleport',
              'exhaust': 'SummonerExhaust', 'exaustao': 'SummonerExhaust', 'smite': 'SummonerSmite', 'castigo': 'SummonerSmite',
              'cleanse': 'SummonerBoost', 'purificar': 'SummonerBoost', 'barrier': 'SummonerBarrier', 'barreira': 'SummonerBarrier',
              'snowball': 'SummonerSnowball', 'marca': 'SummonerSnowball'
            };
            return map[name] || 'SummonerFlash';
          };

          const spell1 = getSpellName(p.summonerSpells?.summonerSpellOne);
          const spell2 = getSpellName(p.summonerSpells?.summonerSpellTwo);

          const getRuneImg = (runeObj: any) => {
            if (!runeObj || !runeObj.rawIcon) return '';
            let iconPath = String(runeObj.rawIcon).toLowerCase();
            if (iconPath.includes('perk-images/')) iconPath = iconPath.split('perk-images/')[1];
            return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/${iconPath}`;
          };

          return {
            summonerId: p.summonerName || p.riotId || 'Invocador',
            summonerName: p.summonerName || p.riotId || 'Invocador',
            championName: champName,
            position: p.position || 'NONE',
            spell1: spell1,
            spell2: spell2,
            primaryRunesImg: getRuneImg(p.runes?.keystone),
            subStyleImg: getRuneImg(p.runes?.secondaryTree)
          };
        };

        const players = data.allPlayers || [];
        const teamIds = Array.from(new Set(players.map((p: any) => p.team)));
        
        const blueTeam = players.filter((p: any) => p.team === teamIds[0] || p.team === 'ORDER' || p.team === 100 || p.team === '100').map(formatPlayer);
        const redTeam = players.filter((p: any) => p.team === teamIds[1] || p.team === 'CHAOS' || p.team === 200 || p.team === '200').map(formatPlayer);

        let finalBlue = blueTeam;
        let finalRed = redTeam;

        if (finalRed.length === 0 && players.length > finalBlue.length) {
          const mid = Math.ceil(players.length / 2);
          finalBlue = players.slice(0, mid).map(formatPlayer);
          finalRed = players.slice(mid).map(formatPlayer);
        }

        res.json({ success: true, data: { blueTeam: finalBlue, redTeam: finalRed } });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Partida ao vivo ainda não iniciou.' });
      }
    });

    this.app.get('/api/lobby', async (req, res) => {
      if (!this.lcuConfig) return res.status(503).json({ success: false });
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const headers = { Authorization: `Basic ${auth}` };
        
        const lobbyRes = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-lobby/v2/lobby`, { headers });
        const finalData = lobbyRes.data;
        
        let searchData = null;
        try {
          const searchRes = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-matchmaking/v1/search`, { headers });
          searchData = searchRes.data;
        } catch (e) {}

        finalData.searchState = searchData;

        if (finalData.members && finalData.members.length > 0) {
          for (let member of finalData.members) {
            if (!this.memberCache[member.summonerId]) {
              try {
                const sumRes = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-summoner/v1/summoners/${member.summonerId}`, { headers });
                const rankRes = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-ranked/v1/ranked-stats/${member.puuid}`, { headers });
                const soloDuo = rankRes.data.queues.find((q: any) => q.queueType === 'RANKED_SOLO_5x5');
                
                let elo = 'UNRANKED';
                if (soloDuo && soloDuo.tier && soloDuo.tier !== 'NONE' && soloDuo.tier !== 'UNRANKED') {
                  elo = `${soloDuo.tier} ${soloDuo.division}`;
                }
                
                this.memberCache[member.summonerId] = {
                  gameName: sumRes.data.gameName || member.summonerName,
                  tagLine: sumRes.data.tagLine || '',
                  elo: elo
                };
              } catch (e) {
                this.memberCache[member.summonerId] = { gameName: member.summonerName, tagLine: '', elo: 'UNRANKED' };
              }
            }
            
            const cached = this.memberCache[member.summonerId];
            member.gameName = cached.gameName;
            member.tagLine = cached.tagLine;
            member.elo = cached.elo;
          }
        }
        res.json({ success: true, data: finalData });
      } catch (error) { res.status(500).json({ success: false }); }
    });

    this.app.get('/api/ready-check', async (req, res) => {
      if (!this.lcuConfig) return res.status(503).json({ success: false });
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const response = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-matchmaking/v1/ready-check`, { headers: { Authorization: `Basic ${auth}` } });
        res.json({ success: true, data: response.data });
      } catch (error) { res.status(500).json({ success: false }); }
    });

    // ----------------------------------------------------------------
    // NOVA CONFIGURAÇÃO: Servir o Front-end do telemóvel localmente
    // ----------------------------------------------------------------
    
    // Aponta para a pasta 'dist' gerada ao fazer o build do nero-web
    // Agora usando electronApp para não conflitar com o Express
    const mobileWebPath = electronApp.isPackaged 
      ? path.join(process.resourcesPath, 'mobile-dist')
      : path.join(process.cwd(), '../nero-web/dist');
    
    // Diz ao Express para servir esses ficheiros como estáticos
    this.app.use(express.static(mobileWebPath));

    // Fallback: Redireciona qualquer rota que não seja /api para o index.html do telemóvel
    // Isso garante que o React/Vue Router do teu nero-web não quebre ao dar refresh na página
    this.app.get(/.*/, (req, res) => {
      res.sendFile(path.join(mobileWebPath, 'index.html'));
    });
  }

  private setupSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Dispositivo conectado via WebSocket');
      if (this.lastPhase) socket.emit('lol:gameflow-phase', this.lastPhase);

      const getAuthHeader = () => ({ Authorization: 'Basic ' + Buffer.from(`riot:${this.lcuConfig!.token}`).toString('base64') });
      const getBaseUrl = () => `https://127.0.0.1:${this.lcuConfig!.port}`;

      socket.on('lol:accept-match', async () => { if (!this.lcuConfig) return; try { await this.axiosInstance.post(`${getBaseUrl()}/lol-matchmaking/v1/ready-check/accept`, {}, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:decline-match', async () => { if (!this.lcuConfig) return; try { await this.axiosInstance.post(`${getBaseUrl()}/lol-matchmaking/v1/ready-check/decline`, {}, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:create-lobby', async (queueId: number) => { if (!this.lcuConfig) return; try { await this.axiosInstance.post(`${getBaseUrl()}/lol-lobby/v2/lobby`, { queueId }, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:leave-lobby', async () => { if (!this.lcuConfig) return; try { await this.axiosInstance.delete(`${getBaseUrl()}/lol-lobby/v2/lobby`, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:start-queue', async () => { if (!this.lcuConfig) return; try { await this.axiosInstance.post(`${getBaseUrl()}/lol-lobby/v2/lobby/matchmaking/search`, {}, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:stop-queue', async () => { if (!this.lcuConfig) return; try { await this.axiosInstance.delete(`${getBaseUrl()}/lol-lobby/v2/lobby/matchmaking/search`, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:change-roles', async (data) => { if (!this.lcuConfig) return; try { await this.axiosInstance.put(`${getBaseUrl()}/lol-lobby/v2/lobby/members/localMember/position-preferences`, data, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:promote-leader', async (id) => { if (!this.lcuConfig) return; try { await this.axiosInstance.post(`${getBaseUrl()}/lol-lobby/v2/lobby/members/${id}/promote`, {}, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:kick-member', async (id) => { if (!this.lcuConfig) return; try { await this.axiosInstance.post(`${getBaseUrl()}/lol-lobby/v2/lobby/members/${id}/kick`, {}, { headers: getAuthHeader() }); } catch (e) {} });

      socket.on('lol:start-practice-mode', async () => {
        if (!this.lcuConfig) return;
        const auth = getAuthHeader();
        const url = getBaseUrl();
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        try {
          await this.axiosInstance.post(`${url}/lol-lobby/v2/lobby`, { isCustom: true, customGameLobby: { configuration: { gameMode: 'PRACTICETOOL', mapId: 11, teamSize: 5, mutators: { id: 1 } }, lobbyName: 'Nero Test', lobbyPassword: '' } }, { headers: auth });
          await delay(1000);
          try { await this.axiosInstance.post(`${url}/lol-lobby/v1/lobby/custom/bots`, { botDifficulty: 'EASY', championId: 86, teamId: '200' }, { headers: auth }); } catch (e) {}
          await delay(1000);
          await this.axiosInstance.post(`${url}/lol-lobby/v1/lobby/custom/start-champ-select`, {}, { headers: auth });
        } catch (e) {}
      });

      socket.on('lol:champ-select-action', async (data: { actionId: number, championId: number, completed: boolean }) => { if (!this.lcuConfig) return; try { await this.axiosInstance.patch(`${getBaseUrl()}/lol-champ-select/v1/session/actions/${data.actionId}`, { championId: data.championId, completed: data.completed }, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:change-spells', async (data: { spell1Id: number, spell2Id: number }) => { if (!this.lcuConfig) return; try { await this.axiosInstance.patch(`${getBaseUrl()}/lol-champ-select/v1/session/my-selection`, { spell1Id: data.spell1Id, spell2Id: data.spell2Id }, { headers: getAuthHeader() }); } catch (e) {} });
      socket.on('lol:change-rune-page', async (pageId: number) => { if (!this.lcuConfig) return; try { await this.axiosInstance.put(`${getBaseUrl()}/lol-perks/v1/currentpage`, Number(pageId), { headers: Object.assign({}, getAuthHeader(), { 'Content-Type': 'application/json' }) }); } catch (e) {} });
      socket.on('lol:save-rune-page', async (data: any) => {
        if (!this.lcuConfig) return;
        try {
          const payload = { name: data.name, primaryStyleId: data.primaryStyleId, subStyleId: data.subStyleId, selectedPerkIds: data.selectedPerkIds, current: true };
          if (data.pageId) await this.axiosInstance.put(`${getBaseUrl()}/lol-perks/v1/pages/${data.pageId}`, payload, { headers: getAuthHeader() });
          else await this.axiosInstance.post(`${getBaseUrl()}/lol-perks/v1/pages`, payload, { headers: getAuthHeader() });
        } catch (e) {}
      });
      socket.on('lol:change-skin', async (skinId: number) => { if (!this.lcuConfig) return; try { await this.axiosInstance.patch(`${getBaseUrl()}/lol-champ-select/v1/session/my-selection`, { selectedSkinId: skinId }, { headers: getAuthHeader() }); } catch (e) {} });
    });
  }

  private startVanguardGameflowMonitor() {
    if (this.gameflowPollInterval) clearInterval(this.gameflowPollInterval);
    this.gameflowPollInterval = setInterval(async () => {
      if (!this.lcuConfig) return;
      try {
        const auth = Buffer.from(`riot:${this.lcuConfig.token}`).toString('base64');
        const response = await this.axiosInstance.get(`https://127.0.0.1:${this.lcuConfig.port}/lol-gameflow/v1/gameflow-phase`, {
          headers: { Authorization: `Basic ${auth}` }
        });
        const currentPhase = response.data;
        if (currentPhase !== this.lastPhase) {
          this.lastPhase = currentPhase;
          if (currentPhase === 'Matchmaking') {
            this.io.emit('lol:gameflow-phase', 'Matchmaking');
          } else if (currentPhase === 'ReadyCheck') {
            this.io.emit('lol:gameflow-phase', 'ReadyCheck');
          } else if (currentPhase === 'ChampSelect') {
            this.io.emit('lol:gameflow-phase', 'ChampSelect');
          } else if (currentPhase === 'InProgress') {
            this.io.emit('lol:gameflow-phase', 'InProgress');
          } else if (currentPhase === 'EndOfGame' || currentPhase === 'PreEndOfGame') {
            this.io.emit('lol:gameflow-phase', 'EndOfGame');
          } else if (currentPhase === 'Lobby') {
            this.io.emit('lol:gameflow-phase', 'Lobby');
          } else {
            this.io.emit('lol:gameflow-phase', currentPhase);
          }
        }
      } catch (e) {}
    }, 1000);
  }

  public setLCUCredentials(config: { port: string; token: string } | null) { 
    this.lcuConfig = config; 
    this.startVanguardGameflowMonitor();
  }

  public start(port = 3000) { 
    this.httpServer.listen(port, '0.0.0.0', () => console.log(`Nero rodando na porta ${port}`)); 
  }
}