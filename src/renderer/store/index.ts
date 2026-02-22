import { create } from 'zustand';
import type {
  ConversationNode,
  Message,
  NodePosition,
  CreateNodeParams,
  UpdateNodeParams
} from '../../shared/types';

const LRU_MAX = 20;

// Move nodeId to front of access order, evict the oldest if over cap.
function applyLRU(
  order: string[],
  nodeId: string,
  messages: Record<string, Message[]>
): { newOrder: string[]; newMessages: Record<string, Message[]> } {
  const newOrder = [nodeId, ...order.filter((id) => id !== nodeId)];
  if (newOrder.length <= LRU_MAX) {
    return { newOrder, newMessages: messages };
  }
  const toEvict = newOrder[LRU_MAX];
  const newMessages = { ...messages };
  delete newMessages[toEvict];
  return { newOrder: newOrder.slice(0, LRU_MAX), newMessages };
}

interface TreeStore {
  // State
  nodes: ConversationNode[];
  messages: Record<string, Message[]>;
  pendingMessages: Record<string, string>; // nodeId -> streaming text in progress
  messageAccessOrder: string[];
  positions: Record<string, NodePosition>;
  selectedNodeId: string | null;
  isInitializing: boolean;
  isLoading: Record<string, boolean>; // per-node loading state
  error: string | null;
  hasApiKey: boolean;

  // Actions
  loadData: () => Promise<void>;
  selectNode: (id: string | null) => void;
  createNode: (params: CreateNodeParams) => Promise<ConversationNode>;
  updateNode: (params: UpdateNodeParams) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  loadMessages: (nodeId: string) => Promise<void>;
  addUserMessage: (nodeId: string, content: string) => Promise<void>;
  sendMessage: (nodeId: string) => void;
  updatePosition: (nodeId: string, x: number, y: number) => Promise<void>;
  forkConversation: (parentId: string, title?: string) => Promise<ConversationNode>;
  setApiKey: (key: string) => Promise<void>;
  checkApiKey: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useTreeStore = create<TreeStore>((set, get) => ({
  // Initial state
  nodes: [],
  messages: {},
  pendingMessages: {},
  messageAccessOrder: [],
  positions: {},
  selectedNodeId: null,
  isInitializing: false,
  isLoading: {},
  error: null,
  hasApiKey: false,

  // Load all data from database and register streaming listeners
  loadData: async () => {
    set({ isInitializing: true, error: null });
    try {
      const [nodes, positions] = await Promise.all([
        window.api.getAllNodes(),
        window.api.getAllPositions()
      ]);

      const positionsMap: Record<string, NodePosition> = {};
      for (const pos of positions) {
        positionsMap[pos.node_id] = pos;
      }

      set({ nodes, positions: positionsMap, isInitializing: false });

      // If there are no nodes, create a root node
      if (nodes.length === 0) {
        await get().createNode({ parent_id: null, title: 'New Research' });
      }
    } catch (error) {
      set({ error: (error as Error).message, isInitializing: false });
    }

    // Register streaming event listeners (remove any stale ones first)
    window.api.removeStreamListeners();

    window.api.onStreamChunk(({ nodeId, chunk }) => {
      if (!chunk) return; // skip the empty "start" signal
      set((state) => ({
        pendingMessages: {
          ...state.pendingMessages,
          [nodeId]: (state.pendingMessages[nodeId] || '') + chunk
        }
      }));
    });

    window.api.onStreamEnd(({ nodeId, message }) => {
      set((state) => {
        const updatedMessages = {
          ...state.messages,
          [nodeId]: [...(state.messages[nodeId] || []), message]
        };
        const { newOrder, newMessages } = applyLRU(
          state.messageAccessOrder,
          nodeId,
          updatedMessages
        );
        return {
          messages: newMessages,
          messageAccessOrder: newOrder,
          isLoading: { ...state.isLoading, [nodeId]: false },
          pendingMessages: { ...state.pendingMessages, [nodeId]: '' }
        };
      });
    });

    window.api.onStreamError(({ nodeId, error }) => {
      set((state) => ({
        isLoading: { ...state.isLoading, [nodeId]: false },
        error
      }));
    });
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
      const node = await window.api.createNode(params);
      const position = await window.api.getPosition(node.id);

      set((state) => ({
        nodes: [...state.nodes, node],
        positions: position
          ? { ...state.positions, [node.id]: position }
          : state.positions
      }));

      return node;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Update a node
  updateNode: async (params) => {
    try {
      const updated = await window.api.updateNode(params);
      if (updated) {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === params.id ? updated : n))
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Delete a node and its descendants
  deleteNode: async (id) => {
    try {
      await window.api.deleteNode(id);

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
      set({ error: (error as Error).message });
    }
  },

  // Load messages for a node (with LRU tracking)
  loadMessages: async (nodeId) => {
    try {
      const messages = await window.api.getConversationContext(nodeId);
      set((state) => {
        const updatedMessages = { ...state.messages, [nodeId]: messages };
        const { newOrder, newMessages } = applyLRU(
          state.messageAccessOrder,
          nodeId,
          updatedMessages
        );
        return { messages: newMessages, messageAccessOrder: newOrder };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Add a user message — throws on failure so caller can preserve input
  addUserMessage: async (nodeId, content) => {
    const message = await window.api.addMessage({
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
  },

  // Fire-and-forget streaming LLM call; results arrive via stream event listeners
  sendMessage: (nodeId) => {
    if (get().isLoading[nodeId]) return; // no-op if already streaming

    set((state) => ({
      isLoading: { ...state.isLoading, [nodeId]: true },
      error: null
    }));

    const context = get().messages[nodeId] || [];
    window.api.sendMessage(nodeId, context).catch((error) => {
      // onStreamError handles the normal case; this catches invoke-level errors
      set((state) => ({
        isLoading: { ...state.isLoading, [nodeId]: false },
        error: (error as Error).message
      }));
    });
  },

  // Update node position
  updatePosition: async (nodeId, x, y) => {
    try {
      const position = await window.api.updatePosition({ node_id: nodeId, x, y });
      set((state) => ({
        positions: { ...state.positions, [nodeId]: position }
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Fork a conversation
  forkConversation: async (parentId, title) => {
    try {
      const node = await get().createNode({
        parent_id: parentId,
        title: title || 'Fork'
      });

      get().selectNode(node.id);

      return node;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Set API key
  setApiKey: async (key) => {
    try {
      const result = await window.api.setApiKey(key);
      if (result) {
        set({ hasApiKey: true, error: null });
      }
    } catch (error) {
      const message = (error as Error).message || 'Failed to set API key';
      set({ error: message });
      throw error;
    }
  },

  // Check if API key is set
  checkApiKey: async () => {
    try {
      const hasKey = await window.api.hasApiKey();
      set({ hasApiKey: hasKey });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Set error
  setError: (error) => {
    set({ error });
  }
}));
