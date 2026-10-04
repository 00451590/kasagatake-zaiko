#!/bin/bash
set -e
cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$PATH:/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "ビルドしています…"
npm run build

echo "ローカル公開サーバーを起動します…"
npm run preview -- --host 127.0.0.1 --port 4173 &
PREVIEW_PID=$!
sleep 1

echo "インターネット用の一時URLを発行します…"
echo "（このウィンドウを閉じると公開が止まります）"
echo ""
npx --yes cloudflared tunnel --url http://127.0.0.1:4173
kill $PREVIEW_PID 2>/dev/null || true
