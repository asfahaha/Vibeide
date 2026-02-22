import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTreeStore } from '../store';

// Minimal mock of window.api
const mockApi = {
  addMessage: vi.fn(),
  sendMessage: vi.fn(),
  getAllNodes: vi.fn().mockResolvedValue([]),
  getAllPositions: vi.fn().mockResolvedValue([]),
  getPosition: vi.fn().mockResolvedValue(null),
  createNode: vi.fn(),
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  getMessages: vi.fn().mockResolvedValue([]),
  getConversationContext: vi.fn().mockResolvedValue([]),
  updatePosition: vi.fn(),
  setApiKey: vi.fn(),
  hasApiKey: vi.fn().mockResolvedValue(false),
  onStreamChunk: vi.fn(),
  onStreamEnd: vi.fn(),
  onStreamError: vi.fn(),
  removeStreamListeners: vi.fn()
};

// Expose on globalThis so window.api resolves in the jsdom environment
(globalThis as any).window = globalThis;
(globalThis as any).api = mockApi;

function resetStore() {
  useTreeStore.setState({
    nodes: [],
    messages: {},
    pendingMessages: {},
    messageAccessOrder: [],
    positions: {},
    selectedNodeId: null,
    isInitializing: false,
    isLoading: {},
    error: null,
    hasApiKey: false
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

describe('addUserMessage', () => {
  it('appends message to store on success', async () => {
    const fakeMsg = { id: '1', node_id: 'n1', role: 'user' as const, content: 'hi', timestamp: 1, is_inherited: false };
    mockApi.addMessage.mockResolvedValueOnce(fakeMsg);

    await useTreeStore.getState().addUserMessage('n1', 'hi');

    const msgs = useTreeStore.getState().messages['n1'];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('hi');
  });

  it('throws and does NOT append to store when DB write fails', async () => {
    mockApi.addMessage.mockRejectedValueOnce(new Error('DB error'));

    await expect(useTreeStore.getState().addUserMessage('n1', 'hi')).rejects.toThrow('DB error');
    expect(useTreeStore.getState().messages['n1']).toBeUndefined();
  });
});

describe('sendMessage', () => {
  it('sets isLoading[nodeId]=true while in flight', () => {
    // sendMessage is fire-and-forget; the invoke promise never resolves in this test
    mockApi.sendMessage.mockReturnValue(new Promise(() => {}));

    useTreeStore.getState().sendMessage('n1');

    expect(useTreeStore.getState().isLoading['n1']).toBe(true);
  });

  it('is a no-op if called while isLoading[nodeId] is already true', () => {
    useTreeStore.setState({ isLoading: { n1: true } });
    mockApi.sendMessage.mockResolvedValue({});

    useTreeStore.getState().sendMessage('n1');

    expect(mockApi.sendMessage).not.toHaveBeenCalled();
  });

  it('sets isLoading[nodeId]=false and sets error on API failure', async () => {
    mockApi.sendMessage.mockRejectedValueOnce(new Error('API down'));

    useTreeStore.getState().sendMessage('n1');

    // Wait for the rejection to be handled
    await new Promise(r => setTimeout(r, 0));

    expect(useTreeStore.getState().isLoading['n1']).toBe(false);
    expect(useTreeStore.getState().error).toBe('API down');
  });
});
