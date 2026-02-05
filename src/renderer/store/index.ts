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
  setError: (error: string | null) => void;
}

export const useTreeStore = create<TreeStore>((set, get) => ({
  // Initial state
  nodes: [],
  messages: {},
  positions: {},
  selectedNodeId: null,
  isLoading: false,
  error: null,
  hasApiKey: false,

  // Load all data from database
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [nodes, positions] = await Promise.all([
        window.api.getAllNodes(),
        window.api.getAllPositions()
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
      set({ error: (error as Error).message, isLoading: false });
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
      set({ error: (error as Error).message });
    }
  },

  // Load messages for a node
  loadMessages: async (nodeId) => {
    try {
      const messages = await window.api.getConversationContext(nodeId);
      set((state) => ({
        messages: { ...state.messages, [nodeId]: messages }
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Add a user message
  addUserMessage: async (nodeId, content) => {
    try {
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
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Send message to LLM and get response
  sendMessage: async (nodeId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.sendMessage(nodeId);

      set((state) => ({
        messages: {
          ...state.messages,
          [nodeId]: [...(state.messages[nodeId] || []), response]
        },
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
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

      // Auto-select the new node
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
