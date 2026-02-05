import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import {
  initDatabase,
  closeDatabase,
  getAllNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  getMessages,
  getConversationContext,
  addMessage,
  getPosition,
  updatePosition,
  getAllPositions
} from './database';
import { setApiKey, hasApiKey, sendMessage } from './llm';
import { IPC_CHANNELS } from '../shared/types';
import type {
  CreateNodeParams,
  UpdateNodeParams,
  AddMessageParams,
  UpdatePositionParams
} from '../shared/types';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#09090b',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Window control handlers
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow.close();
  });

  // Development or production URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function setupIPCHandlers(): void {
  // Database handlers - Nodes
  ipcMain.handle(IPC_CHANNELS.DB_GET_ALL_NODES, () => {
    return getAllNodes();
  });

  ipcMain.handle(IPC_CHANNELS.DB_GET_NODE, (_, id: string) => {
    return getNode(id);
  });

  ipcMain.handle(IPC_CHANNELS.DB_CREATE_NODE, (_, params: CreateNodeParams) => {
    return createNode(params);
  });

  ipcMain.handle(IPC_CHANNELS.DB_UPDATE_NODE, (_, params: UpdateNodeParams) => {
    return updateNode(params);
  });

  ipcMain.handle(IPC_CHANNELS.DB_DELETE_NODE, (_, id: string) => {
    return deleteNode(id);
  });

  // Database handlers - Messages
  ipcMain.handle(IPC_CHANNELS.DB_GET_MESSAGES, (_, nodeId: string) => {
    return getMessages(nodeId);
  });

  ipcMain.handle(IPC_CHANNELS.DB_GET_CONVERSATION_CONTEXT, (_, nodeId: string) => {
    return getConversationContext(nodeId);
  });

  ipcMain.handle(IPC_CHANNELS.DB_ADD_MESSAGE, (_, params: AddMessageParams) => {
    return addMessage(params);
  });

  // Database handlers - Positions
  ipcMain.handle(IPC_CHANNELS.DB_GET_POSITION, (_, nodeId: string) => {
    return getPosition(nodeId);
  });

  ipcMain.handle(IPC_CHANNELS.DB_GET_ALL_POSITIONS, () => {
    return getAllPositions();
  });

  ipcMain.handle(IPC_CHANNELS.DB_UPDATE_POSITION, (_, params: UpdatePositionParams) => {
    return updatePosition(params);
  });

  // LLM handlers
  ipcMain.handle(IPC_CHANNELS.LLM_SET_API_KEY, (_, key: string) => {
    setApiKey(key);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.LLM_HAS_API_KEY, () => {
    return hasApiKey();
  });

  ipcMain.handle(IPC_CHANNELS.LLM_SEND_MESSAGE, async (_, nodeId: string) => {
    const context = getConversationContext(nodeId);
    const response = await sendMessage(context);
    const message = addMessage({
      node_id: nodeId,
      role: 'assistant',
      content: response
    });
    return message;
  });
}

app.whenReady().then(() => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.research-tree.ide');

  // Watch for shortcuts in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Initialize database
  initDatabase();

  // Setup IPC handlers
  setupIPCHandlers();

  // Create window
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
