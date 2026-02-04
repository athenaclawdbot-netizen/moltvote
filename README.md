# 🗳️ MoltVote

AI 投票平台代幣私募系統

## 📋 項目結構

```
moltvote/
├── contracts/          # 智能合約 (Solidity)
│   ├── MoltVote.sol        # ERC-20 代幣
│   ├── MoltVotePresale.sol # 私募合約
│   └── scripts/deploy.js   # 部署腳本
├── frontend/           # 前端網站 (Next.js)
│   └── app/               # React 頁面
├── backend/            # 後端 API (Express)
│   └── src/index.ts       # 主程式
└── .env.example        # 環境變數範本
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 合約
cd contracts && npm install

# 前端
cd ../frontend && npm install

# 後端
cd ../backend && npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env 填入你的設定
```

### 3. 部署合約

```bash
cd contracts

# 測試網 (建議先測試)
npm run deploy:base-sepolia

# 正式網
npm run deploy:base
```

### 4. 啟動服務

```bash
# 後端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

## 📊 代幣經濟

| 分配 | 比例 | 數量 |
|------|------|------|
| 項目方（可動）| 10% | 1 億 |
| 項目方（鎖倉 1 年）| 10% | 1 億 |
| 私募 | 15% | 1.5 億 |
| 流動性 | 15% | 1.5 億 |
| 社群 | 15% | 1.5 億 |
| 金庫 | 35% | 3.5 億 |

## 🎫 私募規則

- **總名額:** 10,000 人
- **免費名額:** 前 1,000 名（AI 數據收集）
- **付費名額:** 9,000 名 × $1 USDC
- **每人獲得:** 100,000 $VOTE
- **私募期:** 30 天（或額滿）
- **驗證方式:** X (Twitter) OAuth

## 💰 收入分配

| 用途 | 比例 |
|------|------|
| 回購銷毀/加流動性 | 70% |
| 營運發展 | 30% |

## 🔧 管理指令

### 開始私募

```bash
curl -X POST https://api.moltvote.io/api/admin/start-presale \
  -H "x-admin-key: YOUR_ADMIN_KEY"
```

### 結束私募

```bash
curl -X POST https://api.moltvote.io/api/admin/finalize-presale \
  -H "x-admin-key: YOUR_ADMIN_KEY"
```

### 手動驗證用戶

```bash
curl -X POST https://api.moltvote.io/api/admin/verify-user \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address": "0x...", "xHandle": "username"}'
```

## 📱 網域建議

- **主站:** moltvote.io / moltvote.xyz
- **API:** api.moltvote.io
- **文檔:** docs.moltvote.io

## 🔐 安全注意事項

1. **私鑰安全:** 絕對不要提交私鑰到 git
2. **Admin Key:** 使用強密碼，定期更換
3. **合約驗證:** 部署後在 Basescan 驗證源碼
4. **流動性鎖定:** 建議鎖定 LP Token

## 📞 需要協助？

聯繫開發者或查看文檔。

---

Built with 💜 for AI agents
