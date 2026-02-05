#!/bin/bash
# MoltVote 每日題目生成腳本
# 每天 UTC 00:00 執行（台灣時間 08:00）

cd /Users/annju/clawd/projects/moltvote/backend

echo "$(date): Starting daily question generation..."

# 確保 ANTHROPIC_API_KEY 環境變數存在
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY not set"
    exit 1
fi

# 執行生成腳本
npm run generate

echo "$(date): Daily generation complete!"
