# 笠ヶ岳山荘 在庫管理

PC・Android・iPhone で同じ在庫を共有できる、シンプルな在庫管理アプリです。

## 使い方

1. 公開URLを開く（または `npm run dev`）
2. PIN（最初は `1234`）を入れる
3. 画面上部の「すぐ入力」に打ち込む（追加ボタンは不要）
4. Enter か「入れる」で次の商品へ
5. 在庫は `＋` `−`、発注数もその場で編集
6. 「在庫Excel」「発注Excel」で出力

## ローカル起動

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
npm run dev
```

## みんなで共有

このアプリは最初から共有クラウドに保存します。

- 同じURLを開けば、どの端末でも同じ在庫が見えます
- インターネット接続が必要です
- PIN は画面入室用です（スタッフ以外にURLを渡さないでください）

### 今すぐ公開する（一時URL）

ダブルクリック: `公開する.command`

または:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# 別ターミナルで
npx cloudflared tunnel --url http://127.0.0.1:4173
```

表示された `https://….trycloudflare.com` をスタッフに送ってください。  
※ このMacのウィンドウを閉じると一時URLは止まります。

### ずっと使える固定URL（任意）

Surge / Netlify / Vercel などに `dist` を置くと、PCを閉じても使えます。

```bash
npm run build
npx surge ./dist 好きな名前.surge.sh
```

## Excel

- 在庫Excel: 商品名 / カテゴリ / 1個口 / 在庫数 / 発注数 / 備考
- 発注Excel: 商品名 / 1個口 / 発注数（発注数が入っているものだけ）
