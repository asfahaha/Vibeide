import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  ConversationNode,
  Message,
  NodePosition,
  CreateNodeParams,
  UpdateNodeParams,
  AddMessageParams,
  UpdatePositionParams
} from '../shared/types';

let db: Database.Database | null = null;

function deserializeNode(row: any): ConversationNode {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    bookmarked: Boolean(row.bookmarked)
  };
}

export function initDatabase(dbPath?: string): void {
  // When dbPath is provided (e.g., ':memory:' for tests), use it directly.
  // Otherwise fall back to the Electron userData path.
  const resolvedPath = dbPath ?? path.join(app.getPath('userData'), 'research-tree.db');

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      tags TEXT DEFAULT '[]',
      bookmarked INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      is_inherited INTEGER DEFAULT 0,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS positions (
      node_id TEXT PRIMARY KEY,
      x REAL NOT NULL,
      y REAL NOT NULL,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_node_id ON messages(node_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
  `);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Node operations
export function getAllNodes(): ConversationNode[] {
  if (!db) throw new Error('Database not initialized');

  const rows = db.prepare('SELECT * FROM nodes ORDER BY created_at ASC').all() as any[];
  return rows.map(deserializeNode);
}

export function getNode(id: string): ConversationNode | null {
  if (!db) throw new Error('Database not initialized');

  const row = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as any;
  if (!row) return null;

  return deserializeNode(row);
}

export function createNode(params: CreateNodeParams): ConversationNode {
  if (!db) throw new Error('Database not initialized');

  const now = Date.now();
  const id = uuidv4();
  const title = params.title || 'New Conversation';
  const tags = JSON.stringify(params.tags || []);

  db.prepare(`
    INSERT INTO nodes (id, parent_id, title, created_at, updated_at, tags, bookmarked)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, params.parent_id, title, now, now, tags);

  // Set default position
  const parentPosition = params.parent_id ? getPosition(params.parent_id) : null;
  const siblings = params.parent_id
    ? db.prepare('SELECT COUNT(*) as count FROM nodes WHERE parent_id = ?').get(params.parent_id) as { count: number }
    : { count: 0 };

  const x = parentPosition ? parentPosition.x + 300 : 100;
  const y = parentPosition ? parentPosition.y + (siblings.count - 1) * 150 : 100;

  updatePosition({ node_id: id, x, y });

  return {
    id,
    parent_id: params.parent_id,
    title,
    created_at: now,
    updated_at: now,
    tags: params.tags || [],
    bookmarked: false
  };
}

export function updateNode(params: UpdateNodeParams): ConversationNode | null {
  if (!db) throw new Error('Database not initialized');

  const existing = getNode(params.id);
  if (!existing) return null;

  const now = Date.now();
  const title = params.title ?? existing.title;
  const tags = params.tags !== undefined ? JSON.stringify(params.tags) : JSON.stringify(existing.tags);
  const bookmarked = params.bookmarked !== undefined ? (params.bookmarked ? 1 : 0) : (existing.bookmarked ? 1 : 0);

  db.prepare(`
    UPDATE nodes SET title = ?, tags = ?, bookmarked = ?, updated_at = ?
    WHERE id = ?
  `).run(title, tags, bookmarked, now, params.id);

  return getNode(params.id);
}

export function deleteNode(id: string): boolean {
  if (!db) throw new Error('Database not initialized');

  const result = db.prepare('DELETE FROM nodes WHERE id = ?').run(id);
  return result.changes > 0;
}

// Message operations
export function getMessages(nodeId: string): Message[] {
  if (!db) throw new Error('Database not initialized');

  const rows = db.prepare(
    'SELECT * FROM messages WHERE node_id = ? ORDER BY timestamp ASC'
  ).all(nodeId) as any[];

  return rows.map(row => ({
    ...row,
    is_inherited: Boolean(row.is_inherited)
  }));
}

export function getConversationContext(nodeId: string): Message[] {
  if (!db) throw new Error('Database not initialized');

  // Build full ancestor path (root-first) using a single recursive CTE
  const ancestorRows = db.prepare(`
    WITH RECURSIVE ancestors(id, parent_id, depth) AS (
      SELECT id, parent_id, 0 FROM nodes WHERE id = ?
      UNION ALL
      SELECT n.id, n.parent_id, a.depth + 1
      FROM nodes n JOIN ancestors a ON n.id = a.parent_id
    )
    SELECT id FROM ancestors ORDER BY depth DESC
  `).all(nodeId) as { id: string }[];

  if (ancestorRows.length === 0) return [];

  const nodePath = ancestorRows.map(r => r.id);

  // Fetch all messages for the entire ancestor path in one query
  const placeholders = nodePath.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT * FROM messages
    WHERE node_id IN (${placeholders})
    ORDER BY timestamp ASC
  `).all(...nodePath) as any[];

  return rows.map(row => ({
    ...row,
    is_inherited: row.node_id !== nodeId
  }));
}

export function addMessage(params: AddMessageParams): Message {
  if (!db) throw new Error('Database not initialized');

  const id = uuidv4();
  const timestamp = Date.now();

  db.prepare(`
    INSERT INTO messages (id, node_id, role, content, timestamp, is_inherited)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(id, params.node_id, params.role, params.content, timestamp);

  // Update node's updated_at timestamp
  db.prepare('UPDATE nodes SET updated_at = ? WHERE id = ?').run(timestamp, params.node_id);

  return {
    id,
    node_id: params.node_id,
    role: params.role,
    content: params.content,
    timestamp,
    is_inherited: false
  };
}

// Position operations
export function getPosition(nodeId: string): NodePosition | null {
  if (!db) throw new Error('Database not initialized');

  const row = db.prepare('SELECT * FROM positions WHERE node_id = ?').get(nodeId) as NodePosition | undefined;
  return row || null;
}

export function getAllPositions(): NodePosition[] {
  if (!db) throw new Error('Database not initialized');

  return db.prepare('SELECT * FROM positions').all() as NodePosition[];
}

export function updatePosition(params: UpdatePositionParams): NodePosition {
  if (!db) throw new Error('Database not initialized');

  db.prepare(`
    INSERT OR REPLACE INTO positions (node_id, x, y)
    VALUES (?, ?, ?)
  `).run(params.node_id, params.x, params.y);

  return {
    node_id: params.node_id,
    x: params.x,
    y: params.y
  };
}
