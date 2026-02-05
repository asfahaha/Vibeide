import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type {
  ConversationNode,
  Message,
  NodePosition,
  CreateNodeParams,
  UpdateNodeParams,
  AddMessageParams,
  UpdatePositionParams
} from '../shared/types';

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

  sendMessage: (nodeId: string): Promise<Message> =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_SEND_MESSAGE, nodeId),

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
