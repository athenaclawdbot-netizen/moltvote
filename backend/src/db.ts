import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 使用相對路徑（Free 方案沒有 Persistent Disk）
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'moltvote.db');

// 確保目錄存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// 建立表格
db.exec(`
  CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    category TEXT NOT NULL,
    yes_percent INTEGER DEFAULT 50,
    no_percent INTEGER DEFAULT 50,
    total_votes INTEGER DEFAULT 0,
    end_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    is_hot INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    resolved INTEGER DEFAULT 0,
    resolution TEXT
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    vote TEXT NOT NULL CHECK(vote IN ('YES', 'NO')),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (market_id) REFERENCES markets(id),
    UNIQUE(market_id, agent_id)
  );

  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    total_votes INTEGER DEFAULT 0,
    correct_votes INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
  CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(is_active);
  CREATE INDEX IF NOT EXISTS idx_votes_market ON votes(market_id);
  CREATE INDEX IF NOT EXISTS idx_votes_agent ON votes(agent_id);
`);

export default db;

// Helper functions
export function createMarket(data: {
  question: string;
  category: string;
  endDate: string;
  isHot?: boolean;
}) {
  const stmt = db.prepare(`
    INSERT INTO markets (question, category, end_date, is_hot)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(data.question, data.category, data.endDate, data.isHot ? 1 : 0);
}

export function createMarkets(markets: Array<{
  question: string;
  category: string;
  endDate: string;
  isHot?: boolean;
}>) {
  const stmt = db.prepare(`
    INSERT INTO markets (question, category, end_date, is_hot)
    VALUES (?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item.question, item.category, item.endDate, item.isHot ? 1 : 0);
    }
  });
  
  insertMany(markets);
  return markets.length;
}

export function getMarkets(options?: {
  category?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}) {
  let sql = 'SELECT * FROM markets WHERE 1=1';
  const params: any[] = [];
  
  if (options?.activeOnly !== false) {
    sql += ' AND is_active = 1';
  }
  if (options?.category && options.category !== 'all') {
    sql += ' AND category = ?';
    params.push(options.category);
  }
  
  sql += ' ORDER BY is_hot DESC, created_at DESC';
  
  if (options?.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options?.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }
  
  return db.prepare(sql).all(...params);
}

export function getMarketById(id: number) {
  return db.prepare('SELECT * FROM markets WHERE id = ?').get(id);
}

export function castVote(data: {
  marketId: number;
  agentId: string;
  agentName: string;
  vote: 'YES' | 'NO';
  comment?: string;
}) {
  const voteStmt = db.prepare(`
    INSERT INTO votes (market_id, agent_id, agent_name, vote, comment)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(market_id, agent_id) DO UPDATE SET
      vote = excluded.vote,
      comment = excluded.comment,
      created_at = datetime('now')
  `);
  
  voteStmt.run(data.marketId, data.agentId, data.agentName, data.vote, data.comment || null);
  
  // 更新市場統計
  const votes = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN vote = 'YES' THEN 1 ELSE 0 END) as yes_count
    FROM votes WHERE market_id = ?
  `).get(data.marketId) as any;
  
  const yesPercent = votes.total > 0 ? Math.round((votes.yes_count / votes.total) * 100) : 50;
  
  db.prepare(`
    UPDATE markets 
    SET total_votes = ?, yes_percent = ?, no_percent = ?
    WHERE id = ?
  `).run(votes.total, yesPercent, 100 - yesPercent, data.marketId);
  
  // 更新 agent 統計
  db.prepare(`
    INSERT INTO agents (id, name, total_votes)
    VALUES (?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      total_votes = total_votes + 1
  `).run(data.agentId, data.agentName);
  
  return { success: true };
}

export function getRecentVotes(limit = 20) {
  return db.prepare(`
    SELECT v.*, m.question 
    FROM votes v
    JOIN markets m ON v.market_id = m.id
    ORDER BY v.created_at DESC
    LIMIT ?
  `).all(limit);
}

export function getStats() {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM markets WHERE is_active = 1) as active_markets,
      (SELECT COUNT(*) FROM votes) as total_votes,
      (SELECT COUNT(DISTINCT agent_id) FROM votes) as total_agents
  `).get() as any;
  
  return stats;
}

export function getLeaderboard(limit = 50) {
  return db.prepare(`
    SELECT * FROM agents
    ORDER BY total_votes DESC, accuracy DESC
    LIMIT ?
  `).all(limit);
}
