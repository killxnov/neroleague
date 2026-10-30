import { exec } from 'child_process';
import { EventEmitter } from 'events';

export interface LCUCredentials {
  port: string;
  token: string;
  protocol: string;
}

export class LCUConnector extends EventEmitter {
  private isConnected = false;
  private intervalId: NodeJS.Timeout | null = null;

  public start() {
    this.intervalId = setInterval(() => this.checkProcess(), 5000);
    this.checkProcess(); 
  }

  private checkProcess() {
    // Usando PowerShell moderno ao invés do wmic legado para varrer processos com mais precisão
    const command = `powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name = 'LeagueClientUx.exe'\\" | Select-Object -ExpandProperty CommandLine"`;

    // Aumentamos o buffer maximo para evitar cortes na leitura do Windows
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout) => {
      // Se der erro ou a string vier vazia (bloqueio de permissão), considera desconectado
      if (error || !stdout || stdout.trim() === '') {
        if (this.isConnected) {
          this.isConnected = false;
          this.emit('disconnect');
        }
        return;
      }

      if (!this.isConnected) {
        const portMatch = stdout.match(/--app-port=([0-9]+)/);
        const tokenMatch = stdout.match(/--remoting-auth-token=([\w-]+)/);

        if (portMatch && tokenMatch) {
          this.isConnected = true;
          const credentials: LCUCredentials = {
            port: portMatch[1],
            token: tokenMatch[1],
            protocol: 'https'
          };
          this.emit('connect', credentials);
        }
      }
    });
  }

  public stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}