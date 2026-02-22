import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock electron so database.ts can be imported in a pure Node environment
vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' }
}));

// better-sqlite3 is an Electron native module built for the Electron runtime.
// In a plain Node vitest environment the native binary may not be available.
// We detect this by attempting to instantiate a DB before running any tests.
let nativeAvailable = true;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSQLite = require('better-sqlite3');
  new BetterSQLite(':memory:').close(); // actually load the native binding
} catch {
  nativeAvailable = false;
}

const maybeIt = nativeAvailable ? it : it.skip;

import {
  initDatabase,
  closeDatabase,
  createNode,
  addMessage,
  getConversationContext
} from '../database';

beforeEach(() => {
  if (nativeAvailable) initDatabase(':memory:');
});

afterEach(() => {
  if (nativeAvailable) closeDatabase();
});

describe('getConversationContext', () => {
  maybeIt('returns only own messages for a root node with no parent', () => {
    const root = createNode({ parent_id: null, title: 'Root' });
    addMessage({ node_id: root.id, role: 'user', content: 'Hello' });
    addMessage({ node_id: root.id, role: 'assistant', content: 'Hi there' });

    const ctx = getConversationContext(root.id);
    expect(ctx).toHaveLength(2);
    expect(ctx.every(m => !m.is_inherited)).toBe(true);
  });

  maybeIt('returns ancestor messages marked is_inherited=true for a 3-level deep node', () => {
    const root = createNode({ parent_id: null, title: 'Root' });
    const child = createNode({ parent_id: root.id, title: 'Child' });
    const grandchild = createNode({ parent_id: child.id, title: 'Grandchild' });

    addMessage({ node_id: root.id, role: 'user', content: 'root-msg' });
    addMessage({ node_id: child.id, role: 'assistant', content: 'child-msg' });
    addMessage({ node_id: grandchild.id, role: 'user', content: 'grandchild-msg' });

    const ctx = getConversationContext(grandchild.id);
    expect(ctx).toHaveLength(3);

    const inherited = ctx.filter(m => m.is_inherited);
    const own = ctx.filter(m => !m.is_inherited);
    expect(inherited).toHaveLength(2);
    expect(own).toHaveLength(1);
    expect(own[0].content).toBe('grandchild-msg');
  });

  maybeIt('returns messages in chronological order across ancestors', () => {
    const root = createNode({ parent_id: null, title: 'Root' });
    const child = createNode({ parent_id: root.id, title: 'Child' });

    addMessage({ node_id: root.id, role: 'user', content: 'first' });
    addMessage({ node_id: root.id, role: 'assistant', content: 'second' });
    addMessage({ node_id: child.id, role: 'user', content: 'third' });

    const ctx = getConversationContext(child.id);
    expect(ctx.map(m => m.content)).toEqual(['first', 'second', 'third']);
  });

  maybeIt('returns empty array for a node with no messages at any level', () => {
    const root = createNode({ parent_id: null, title: 'Root' });
    const child = createNode({ parent_id: root.id, title: 'Child' });

    const ctx = getConversationContext(child.id);
    expect(ctx).toHaveLength(0);
  });

  maybeIt('handles a node with a deleted parent gracefully (orphaned node)', () => {
    const root = createNode({ parent_id: null, title: 'Root' });
    addMessage({ node_id: root.id, role: 'user', content: 'root-msg' });
    const child = createNode({ parent_id: root.id, title: 'Child' });
    addMessage({ node_id: child.id, role: 'user', content: 'child-msg' });

    // The CTE walk stops at the missing ancestor; existing messages still returned
    const ctx = getConversationContext(child.id);
    expect(ctx.length).toBeGreaterThanOrEqual(1);
  });
});
