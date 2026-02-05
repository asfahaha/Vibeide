// Core data models for the Research Tree IDE

export interface ConversationNode {
  id: string;
  parent_id: string | null;
  title: string;
  created_at: number;
  updated_at: number;
  tags: string[];
  bookmarked: boolean;
}

export interface Message {
  id: string;
  node_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  is_inherited: boolean;
}

export interface NodePosition {
  node_id: string;
  x: number;
  y: number;
}

export interface TreeState {
  nodes: ConversationNode[];
  messages: Message[];
  positions: NodePosition[];
}

// API types for IPC communication
export interface CreateNodeParams {
  parent_id: string | null;
  title?: string;
  tags?: string[];
}

export interface UpdateNodeParams {
  id: string;
  title?: string;
  tags?: string[];
  bookmarked?: boolean;
}

export interface AddMessageParams {
  node_id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface UpdatePositionParams {
  node_id: string;
  x: number;
  y: number;
}

export interface SendMessageParams {
  node_id: string;
  content: string;
}

export interface ApiKeyConfig {
  anthropic_api_key: string;
}

export interface LLMConfig {
  model: string;
  max_tokens: number;
  temperature: number;
}

// IPC Channel names
export const IPC_CHANNELS = {
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

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const;
