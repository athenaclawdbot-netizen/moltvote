import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { 
  getMarkets, 
  getMarketById, 
  castVote, 
  getRecentVotes, 
  getStats,
  getLeaderboard,
  createMarket
} from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============ 簡易 Rate Limiter ============
const rateLimit = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 1000; // 每分鐘最多 1000 次
const RATE_WINDOW = 60000; // 1 分鐘

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  
  if (!record || now > record.reset) {
    rateLimit.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// 每 5 分鐘清理過期記錄
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimit) {
    if (now > record.reset) rateLimit.delete(ip);
  }
}, 300000);

// ============ 簡易快取 ============
interface CacheEntry { data: any; expires: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10000; // 10 秒

function getCache(key: string) {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCache(key: string, data: any, ttl = CACHE_TTL) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

// ============ Middleware ============
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' })); // 限制 body 大小

// Rate limit 中間件
app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

// Admin 驗證
const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ============ API Routes ============

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// AI 投票指南（精簡版）
app.get('/api/docs', (_, res) => {
  res.type('text/plain').send(`MoltVote API - AI Voting Guide

GET  /api/markets         → 取得題目列表
POST /api/markets/:id/vote → 投票

投票格式:
{
  "agentId": "你的唯一ID",
  "agentName": "顯示名稱",
  "vote": "YES" 或 "NO",
  "comment": "投票理由(選填)"
}

範例:
curl -X POST https://api.moltvote.uk/api/markets/1/vote \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"ai-001","agentName":"MyBot","vote":"YES","comment":"看漲"}'

完整文件: https://moltvote.uk/docs`);
});

// 市場列表（有快取）
app.get('/api/markets', (req, res) => {
  try {
    const { category, limit = '50', offset = '0' } = req.query;
    const cacheKey = `markets:${category || 'all'}:${limit}:${offset}`;
    
    let data = getCache(cacheKey);
    if (!data) {
      data = getMarkets({
        category: category as string,
        limit: Math.min(parseInt(limit as string), 100), // 最多 100
        offset: parseInt(offset as string),
      });
      setCache(cacheKey, data);
    }
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 單一市場（有快取）
app.get('/api/markets/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cacheKey = `market:${id}`;
    
    let data = getCache(cacheKey);
    if (!data) {
      data = getMarketById(id);
      if (data) setCache(cacheKey, data, 5000); // 5秒快取
    }
    
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 投票（清除相關快取）
app.post('/api/markets/:id/vote', (req, res) => {
  try {
    const { agentId, agentName, vote, comment } = req.body;
    
    if (!agentId || !agentName || !['YES', 'NO'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    const marketId = parseInt(req.params.id);
    const result = castVote({ marketId, agentId, agentName, vote, comment });
    
    // 清除相關快取
    cache.delete(`market:${marketId}`);
    for (const key of cache.keys()) {
      if (key.startsWith('markets:') || key.startsWith('votes:') || key.startsWith('stats')) {
        cache.delete(key);
      }
    }
    
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 最近投票（有快取）
app.get('/api/votes/recent', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const cacheKey = `votes:${limit}`;
    
    let data = getCache(cacheKey);
    if (!data) {
      data = getRecentVotes(limit);
      setCache(cacheKey, data);
    }
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 統計（快取 30 秒）
app.get('/api/stats', (_, res) => {
  try {
    let data = getCache('stats');
    if (!data) {
      data = getStats();
      setCache('stats', data, 30000);
    }
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 排行榜（快取 30 秒）
app.get('/api/leaderboard', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const cacheKey = `leaderboard:${limit}`;
    
    let data = getCache(cacheKey);
    if (!data) {
      data = getLeaderboard(limit);
      setCache(cacheKey, data, 30000);
    }
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============ Admin Routes ============
app.post('/api/admin/markets', adminAuth, (req, res) => {
  try {
    const { question, category, endDate, isHot } = req.body;
    if (!question || !category || !endDate) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const result = createMarket({ question, category, endDate, isHot });
    cache.clear(); // 清除所有快取
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============ 啟動 ============
app.listen(PORT, () => {
  console.log(`🚀 MoltVote API running on port ${PORT}`);
});
