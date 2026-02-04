import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'moltvote-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// 合約設定
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const PRESALE_ABI = [
  'function verifyUser(address user, string calldata _xHandle) external',
  'function batchVerifyUsers(address[] calldata users, string[] calldata handles) external',
  'function startPresale() external',
  'function finalizePresale() external',
  'function getPresaleStatus() external view returns (bool, bool, uint256, uint256, uint256, uint256)',
  'function getUserStatus(address user) external view returns (bool, bool, uint256, string)',
];

const presaleContract = new ethers.Contract(
  process.env.PRESALE_ADDRESS!,
  PRESALE_ABI,
  wallet
);

// 儲存待驗證用戶（實際應用用 DB）
interface PendingUser {
  address: string;
  xId: string;
  xHandle: string;
  timestamp: number;
}
const pendingVerifications: Map<string, PendingUser> = new Map();

// Twitter OAuth 設定
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY!,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
    callbackURL: `${process.env.BACKEND_URL}/auth/twitter/callback`,
  },
  (token, tokenSecret, profile, done) => {
    return done(null, {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
    });
  }
));

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

// ============ API Routes ============

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 開始 Twitter 驗證
app.get('/auth/twitter', (req, res, next) => {
  const { wallet: walletAddress } = req.query;
  if (walletAddress) {
    (req.session as any).walletAddress = walletAddress;
  }
  passport.authenticate('twitter')(req, res, next);
});

// Twitter 回調
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  async (req, res) => {
    const user = req.user as any;
    const walletAddress = (req.session as any).walletAddress;
    
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_wallet`);
    }
    
    try {
      // 儲存待驗證資訊
      pendingVerifications.set(walletAddress.toLowerCase(), {
        address: walletAddress,
        xId: user.id,
        xHandle: user.username,
        timestamp: Date.now(),
      });
      
      // 呼叫合約驗證用戶
      console.log(`Verifying user: ${walletAddress} -> @${user.username}`);
      const tx = await presaleContract.verifyUser(walletAddress, user.username);
      await tx.wait();
      console.log(`Verified! TX: ${tx.hash}`);
      
      res.redirect(`${process.env.FRONTEND_URL}?verified=true&handle=${user.username}`);
    } catch (error: any) {
      console.error('Verification error:', error);
      res.redirect(`${process.env.FRONTEND_URL}?error=${encodeURIComponent(error.message)}`);
    }
  }
);

// 查詢用戶狀態
app.get('/api/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const status = await presaleContract.getUserStatus(address);
    res.json({
      verified: status[0],
      claimed: status[1],
      order: Number(status[2]),
      xHandle: status[3],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 查詢私募狀態
app.get('/api/presale/status', async (req, res) => {
  try {
    const status = await presaleContract.getPresaleStatus();
    res.json({
      active: status[0],
      finalized: status[1],
      freeClaimed: Number(status[2]),
      paidClaimed: Number(status[3]),
      totalRaised: Number(status[4]) / 1e6,
      timeRemaining: Number(status[5]),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Admin Routes ============

const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// 開始私募
app.post('/api/admin/start-presale', adminAuth, async (req, res) => {
  try {
    const tx = await presaleContract.startPresale();
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 結束私募
app.post('/api/admin/finalize-presale', adminAuth, async (req, res) => {
  try {
    const tx = await presaleContract.finalizePresale();
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 手動驗證用戶
app.post('/api/admin/verify-user', adminAuth, async (req, res) => {
  try {
    const { address, xHandle } = req.body;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const tx = await presaleContract.verifyUser(address, xHandle);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 批量驗證
app.post('/api/admin/batch-verify', adminAuth, async (req, res) => {
  try {
    const { users } = req.body; // [{ address, xHandle }, ...]
    const addresses = users.map((u: any) => u.address);
    const handles = users.map((u: any) => u.xHandle);
    
    const tx = await presaleContract.batchVerifyUsers(addresses, handles);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash, count: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 統計數據
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const status = await presaleContract.getPresaleStatus();
    const pendingCount = pendingVerifications.size;
    
    res.json({
      presale: {
        active: status[0],
        finalized: status[1],
        freeClaimed: Number(status[2]),
        paidClaimed: Number(status[3]),
        totalRaised: Number(status[4]) / 1e6,
        timeRemaining: Number(status[5]),
      },
      pending: pendingCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 MoltVote Backend running on port ${PORT}`);
  console.log(`   Presale Contract: ${process.env.PRESALE_ADDRESS}`);
});
