import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import { LCUConnector } from './lcu/lcu-connector';
import { NeroServer } from './server/server';
import { LCUWebSocket } from './lcu/lcu-websocket';
import * as os from 'os';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// 1. GERA O PIN APENAS UMA VEZ
const sessionPIN = Math.floor(1000 + Math.random() * 9000).toString();

// Função para pegar o IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const porta = 3000;
const networkLink = `http://${localIP}:${porta}`;

// Inicializa Servidor e Conector LCU com o PIN único
const neroServer = new NeroServer(sessionPIN);
const lcu = new LCUConnector();
const lcuWs = new LCUWebSocket();

// 2. Canal para o HTML do PC puxar o PIN e o Link corretos
ipcMain.handle('get-connection-info', () => {
  return { pin: sessionPIN, link: networkLink };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 350,
    height: 400,
    resizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../src/renderer/sentinel.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    lcu.start();
    neroServer.start(porta); // Inicia o servidor local na porta 3000
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

lcu.on('connect', (credentials) => {
  neroServer.setLCUCredentials(credentials);
  mainWindow?.webContents.send('lcu-status', { status: 'connected' });
  console.log('LoL conectado.');
  
  // Inicia a escuta em tempo real
  lcuWs.connect(credentials.port, credentials.token);
});

lcu.on('disconnect', () => {
  neroServer.setLCUCredentials(null);
  mainWindow?.webContents.send('lcu-status', { status: 'disconnected' });
  console.log('LoL desconectado.');
  
  // Para de escutar
  lcuWs.disconnect();
});

lcuWs.on('ready-check', (data) => {
  // O state pode ser 'InProgress' (Apareceu), 'EveryoneReady' (Todos aceitaram), etc
  neroServer.emitToClient('lol:ready-check', data);
});

lcuWs.on('lobby-update', (data) => {
  neroServer.emitToClient('lol:lobby-update', data);
});

lcuWs.on('champ-select', (data) => {
  neroServer.emitToClient('lol:champ-select', data);
});

function createTray() {
  // Ajuste o caminho conforme a localização do seu main.js em relação à pasta assets
  const iconPath = path.join(__dirname, '../../src/renderer/sentinel.ico');
  
  // Cria a imagem a partir do arquivo
  const trayIcon = nativeImage.createFromPath(iconPath);

  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Exibir', click: () => mainWindow?.show() },
    { label: `PIN: ${sessionPIN}`, enabled: false }, // 3. O tray usa o mesmo PIN
    { type: 'separator' },
    { 
      label: 'Encerrar', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('Nero');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});