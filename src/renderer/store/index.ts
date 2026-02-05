import { create } from 'zustand';
import type {
  ConversationNode,
  Message,
  NodePosition,
  CreateNodeParams,
  UpdateNodeParams
} from '../../shared/types';

interface TreeStore {
  // State
  nodes: ConversationNode[];
  messages: Record<string, Message[]>;
  positions: Record<string, NodePosition>;
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  errorDetails: string | null;
  hasApiKey: boolean;

  // Actions
  loadData: () => Promise<void>;
  selectNode: (id: string | null) => void;
  createNode: (params: CreateNodeParams) => Promise<ConversationNode>;
  updateNode: (params: UpdateNodeParams) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  loadMessages: (nodeId: string) => Promise<void>;
  addUserMessage: (nodeId: string, content: string) => Promise<void>;
  sendMessage: (nodeId: string) => Promise<void>;
  updatePosition: (nodeId: string, x: number, y: number) => Promise<void>;
  forkConversation: (parentId: string, title?: string) => Promise<ConversationNode>;
  setApiKey: (key: string) => Promise<void>;
  checkApiKey: () => Promise<void>;
  setError: (error: string | null, details?: string | null) => void;
}

const diagnosticsMarker = '\n\nDiagnostics:\n';

const parseError = (error: unknown, fallbackMessage: string) => {
  let message = fallbackMessage;
  let details: string | null = null;

  if (error instanceof Error) {
    message = error.message || fallbackMessage;
    details = error.stack || error.message;
  } else if (typeof error === 'string') {
    message = error;
    details = error;
  } else if (error) {
    try {
      details = JSON.stringify(error, null, 2);
    } catch {
      details = String(error);
    }
  }

  if (message.includes(diagnosticsMarker)) {
    const [summary, diagnostics] = message.split(diagnosticsMarker);
    return {
      message: summary || fallbackMessage,
      details: diagnostics ? `Diagnostics:\n${diagnostics}` : details
    };
  }

  return { message, details };
};

const getApi = () => {
  if (!window.api) {
    throw new Error(
      'App API not available. Make sure the Electron preload script is running (the Vite dev server alone does not provide window.api).'
    );
  }
  return window.api;
};

export const useTreeStore = create<TreeStore>((set, get) => ({
  // Initial state
  nodes: [],
  messages: {},
  positions: {},
  selectedNodeId: null,
  isLoading: false,
  error: null,
  errorDetails: null,
  hasApiKey: false,

  // Load all data from database
  loadData: async () => {
    set({ isLoading: true, error: null, errorDetails: null });
    try {
      const api = getApi();
      const [nodes, positions] = await Promise.all([
        api.getAllNodes(),
        api.getAllPositions()
      ]);

      const positionsMap: Record<string, NodePosition> = {};
      for (const pos of positions) {
        positionsMap[pos.node_id] = pos;
      }

      set({ nodes, positions: positionsMap, isLoading: false });

      // If there are no nodes, create a root node
      if (nodes.length === 0) {
        await get().createNode({ parent_id: null, title: 'New Research' });
      }
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to load data');
      set({ error: message, errorDetails: details, isLoading: false });
    }
  },

  // Select a node
  selectNode: (id) => {
    set({ selectedNodeId: id });
    if (id) {
      get().loadMessages(id);
    }
  },

  // Create a new node
  createNode: async (params) => {
    try {
      const api = getApi();
      const node = await api.createNode(params);
      const position = await api.getPosition(node.id);

      set((state) => ({
        nodes: [...state.nodes, node],
        positions: position
          ? { ...state.positions, [node.id]: position }
          : state.positions
      }));

      return node;
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to create node');
      set({ error: message, errorDetails: details });
      throw error;
    }
  },

  // Update a node
  updateNode: async (params) => {
    try {
      const api = getApi();
      const updated = await api.updateNode(params);
      if (updated) {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === params.id ? updated : n))
        }));
      }
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to update node');
      set({ error: message, errorDetails: details });
    }
  },

  // Delete a node and its descendants
  deleteNode: async (id) => {
    try {
      const api = getApi();
      await api.deleteNode(id);

      // Find all descendant IDs
      const findDescendants = (nodeId: string, nodes: ConversationNode[]): string[] => {
        const children = nodes.filter((n) => n.parent_id === nodeId);
        return [nodeId, ...children.flatMap((c) => findDescendants(c.id, nodes))];
      };

      const toDelete = new Set(findDescendants(id, get().nodes));

      set((state) => ({
        nodes: state.nodes.filter((n) => !toDelete.has(n.id)),
        selectedNodeId: toDelete.has(state.selectedNodeId || '') ? null : state.selectedNodeId
      }));
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to delete node');
      set({ error: message, errorDetails: details });
    }
  },

  // Load messages for a node
  loadMessages: async (nodeId) => {
    try {
      const api = getApi();
      const messages = await api.getConversationContext(nodeId);
      set((state) => ({
        messages: { ...state.messages, [nodeId]: messages }
      }));
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to load messages');
      set({ error: message, errorDetails: details });
    }
  },

  // Add a user message
  addUserMessage: async (nodeId, content) => {
    try {
      const api = getApi();
      const message = await api.addMessage({
        node_id: nodeId,
        role: 'user',
        content
      });

      set((state) => ({
        messages: {
          ...state.messages,
          [nodeId]: [...(state.messages[nodeId] || []), message]
        }
      }));
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to add message');
      set({ error: message, errorDetails: details });
    }
  },

  // Send message to LLM and get response
  sendMessage: async (nodeId) => {
    set({ isLoading: true, error: null, errorDetails: null });
    try {
      const api = getApi();
      const response = await api.sendMessage(nodeId);

      set((state) => ({
        messages: {
          ...state.messages,
          [nodeId]: [...(state.messages[nodeId] || []), response]
        },
        isLoading: false
      }));
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to send message');
      set({ error: message, errorDetails: details, isLoading: false });
    }
  },

  // Update node position
  updatePosition: async (nodeId, x, y) => {
    try {
      const api = getApi();
      const position = await api.updatePosition({ node_id: nodeId, x, y });
      set((state) => ({
        positions: { ...state.positions, [nodeId]: position }
      }));
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to update node position');
      set({ error: message, errorDetails: details });
    }
  },

  // Fork a conversation
  forkConversation: async (parentId, title) => {
    try {
      const node = await get().createNode({
        parent_id: parentId,
        title: title || 'Fork'
      });

      // Auto-select the new node
      get().selectNode(node.id);

      return node;
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to fork conversation');
      set({ error: message, errorDetails: details });
      throw error;
    }
  },

  // Set API key
  setApiKey: async (key) => {
    try {
      const api = getApi();
      const result = await api.setApiKey(key);
      if (result) {
        set({ hasApiKey: true, error: null, errorDetails: null });
      }
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to set API key');
      set({ error: message, errorDetails: details });
      throw error;
    }
  },

  // Check if API key is set
  checkApiKey: async () => {
    try {
      const api = getApi();
      const hasKey = await api.hasApiKey();
      set({ hasApiKey: hasKey });
    } catch (error) {
      const { message, details } = parseError(error, 'Failed to check API key');
      set({ error: message, errorDetails: details });
    }
  },

  // Set error
  setError: (error, details = null) => {
    set({ error, errorDetails: details });
  }
}));
