import { contextBridge, ipcRenderer } from 'electron';

// IPC Channel names - inlined to avoid module resolution issues
const IPC_CHANNELS = {
  // Database operations
  DB_GET_ALL_NODES: 'db:get-all-nodes',
  DB_GET_NODE: 'db:get-node',
  DB_CREATE_NODE: 'db:create-node',
  DB_UPDATE_NODE: 'db:update-node',
  DB_DELETE_NODE: 'db:delete-node',
  DB_GET_MESSAGES: 'db:get-messages',
  DB_GET_CONVERSATION_CONTEXT: 'db:get-conversation-context',
  DB_ADD_MESSAGE: 'db:add-message',
  DB_GET_POSITION: 'db:get-position',
  DB_UPDATE_POSITION: 'db:update-position',
  DB_GET_ALL_POSITIONS: 'db:get-all-positions',

  // LLM operations
  LLM_SEND_MESSAGE: 'llm:send-message',
  LLM_SET_API_KEY: 'llm:set-api-key',
  LLM_HAS_API_KEY: 'llm:has-api-key',
  LLM_STREAM_CHUNK: 'llm:stream-chunk',
  LLM_STREAM_END: 'llm:stream-end',
  LLM_STREAM_ERROR: 'llm:stream-error',

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const;

// Types for the API - inlined to avoid module resolution issues
interface ConversationNode {
  id: string;
  parent_id: string | null;
  title: string;
  created_at: number;
  updated_at: number;
  tags: string[];
  bookmarked: boolean;
}

interface Message {
  id: string;
  node_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  is_inherited: boolean;
}

interface NodePosition {
  node_id: string;
  x: number;
  y: number;
}

interface CreateNodeParams {
  parent_id: string | null;
  title?: string;
  tags?: string[];
}

interface UpdateNodeParams {
  id: string;
  title?: string;
  tags?: string[];
  bookmarked?: boolean;
}

interface AddMessageParams {
  node_id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UpdatePositionParams {
  node_id: string;
  x: number;
  y: number;
}

// API exposed to renderer process
const api = {
  // Node operations
  getAllNodes: (): Promise<ConversationNode[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_ALL_NODES),

  getNode: (id: string): Promise<ConversationNode | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_NODE, id),

  createNode: (params: CreateNodeParams): Promise<ConversationNode> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_NODE, params),

  updateNode: (params: UpdateNodeParams): Promise<ConversationNode | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_NODE, params),

  deleteNode: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_NODE, id),

  // Message operations
  getMessages: (nodeId: string): Promise<Message[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_MESSAGES, nodeId),

  getConversationContext: (nodeId: string): Promise<Message[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_CONVERSATION_CONTEXT, nodeId),

  addMessage: (params: AddMessageParams): Promise<Message> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_ADD_MESSAGE, params),

  // Position operations
  getPosition: (nodeId: string): Promise<NodePosition | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_POSITION, nodeId),

  getAllPositions: (): Promise<NodePosition[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_ALL_POSITIONS),

  updatePosition: (params: UpdatePositionParams): Promise<NodePosition> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_POSITION, params),

  // LLM operations
  setApiKey: (key: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_SET_API_KEY, key),

  hasApiKey: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_HAS_API_KEY),

  // Issue 13: pass context from renderer so main process needn't re-query DB
  sendMessage: (nodeId: string, context: Message[]): Promise<Message> =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_SEND_MESSAGE, nodeId, context),

  // Issue 4: streaming event listeners
  onStreamChunk: (callback: (data: { nodeId: string; chunk: string }) => void): void => {
    ipcRenderer.on('llm:stream-chunk', (_e, data) => callback(data));
  },

  onStreamEnd: (callback: (data: { nodeId: string; message: Message }) => void): void => {
    ipcRenderer.on('llm:stream-end', (_e, data) => callback(data));
  },

  onStreamError: (callback: (data: { nodeId: string; error: string }) => void): void => {
    ipcRenderer.on('llm:stream-error', (_e, data) => callback(data));
  },

  removeStreamListeners: (): void => {
    ipcRenderer.removeAllListeners('llm:stream-chunk');
    ipcRenderer.removeAllListeners('llm:stream-end');
    ipcRenderer.removeAllListeners('llm:stream-error');
  },

  // Window operations
  minimizeWindow: (): void =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),

  maximizeWindow: (): void =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),

  closeWindow: (): void =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE)
};

// Expose API to renderer
contextBridge.exposeInMainWorld('api', api);

// Type declaration for the exposed API
export type API = typeof api;
