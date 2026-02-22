import { app, shell, BrowserWindow, ipcMain, safeStorage } from 'electron';
import { join } from 'path';
import fs from 'fs';
import nodePath from 'path';
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
import { setApiKey, hasApiKey, streamMessage } from './llm';
import { IPC_CHANNELS } from '../shared/types';
import type {
  CreateNodeParams,
  UpdateNodeParams,
  AddMessageParams,
  UpdatePositionParams,
  Message
} from '../shared/types';

function loadSavedApiKey(): void {
  const keyFile = nodePath.join(app.getPath('userData'), 'api-key.enc');
  if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(keyFile)) return;
  try {
    const encrypted = fs.readFileSync(keyFile);
    const key = safeStorage.decryptString(encrypted);
    setApiKey(key);
  } catch {
    // ignore corrupt/missing file
  }
}

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
    backgroundColor: '#FAFAFA',
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

  // Development or production URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function setupIPCHandlers(): void {
  // Window control handlers — use getFocusedWindow to avoid closed-over stale references
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

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
    try {
      setApiKey(key);
      // Persist encrypted key to disk
      if (safeStorage.isEncryptionAvailable()) {
        const keyFile = nodePath.join(app.getPath('userData'), 'api-key.enc');
        const encrypted = safeStorage.encryptString(key);
        fs.writeFileSync(keyFile, encrypted);
      }
      return true;
    } catch (error) {
      console.error('Failed to set API key:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.LLM_HAS_API_KEY, () => {
    return hasApiKey();
  });

  // Streaming LLM handler — sends events back to renderer during the stream
  ipcMain.handle(IPC_CHANNELS.LLM_SEND_MESSAGE, async (event, nodeId: string, context: Message[]) => {
    const webContents = event.sender;
    try {
      webContents.send(IPC_CHANNELS.LLM_STREAM_CHUNK, { nodeId, chunk: '' }); // signal start
      const fullText = await streamMessage(context, (chunk) => {
        webContents.send(IPC_CHANNELS.LLM_STREAM_CHUNK, { nodeId, chunk });
      });
      const message = addMessage({ node_id: nodeId, role: 'assistant', content: fullText });
      webContents.send(IPC_CHANNELS.LLM_STREAM_END, { nodeId, message });
      return message;
    } catch (error) {
      webContents.send(IPC_CHANNELS.LLM_STREAM_ERROR, { nodeId, error: (error as Error).message });
      throw error;
    }
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

  // Load persisted API key (if any)
  loadSavedApiKey();

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
