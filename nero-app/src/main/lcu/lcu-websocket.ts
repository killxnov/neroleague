import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class LCUWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;

  public connect(port: string, token: string) {
    if (this.ws) return;

    const auth = Buffer.from(`riot:${token}`).toString('base64');
    const url = `wss://127.0.0.1:${port}/`;

    this.ws = new WebSocket(url, {
      headers: { Authorization: `Basic ${auth}` },
      rejectUnauthorized: false // Ignora o certificado autoassinado da Riot
    });

    this.ws.on('open', () => {
      console.log('Conectado ao WebSocket do LCU');
      // Inscreve o Nero para escutar TODOS os eventos da API do LoL (Código 5 no protocolo WAMP)
      this.ws?.send(JSON.stringify([5, 'OnJsonApiEvent']));
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.length === 3 && message[0] === 8) {
          const eventData = message[2];
          
          if (eventData.uri === '/lol-matchmaking/v1/ready-check') {
            this.emit('ready-check', eventData.data);
          }
          
          if (eventData.uri === '/lol-lobby/v2/lobby') {
            // SE O EVENTO FOR DELETE, AVISA O SITE PARA LIMPAR A TELA (NULL)
            if (eventData.eventType === 'Delete') this.emit('lobby-update', null);
            else this.emit('lobby-update', eventData.data);
          }

          if (eventData.uri === '/lol-champ-select/v1/session') {
            // SE ALGUÉM QUITAR OU A PARTIDA INICIAR, LIMPA A TELA DE CAMPEÕES (NULL)
            if (eventData.eventType === 'Delete') this.emit('champ-select', null);
            else this.emit('champ-select', eventData.data);
          }
        }
      } catch (e) {}
    });

    this.ws.on('error', (err) => console.error('Erro no WebSocket do LCU:', err));
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('Desconectado do WebSocket do LCU');
    }
  }
}