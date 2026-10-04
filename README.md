# 笠ヶ岳山荘 在庫管理

PC・Android・iPhone で同じ在庫を共有できる在庫管理アプリです。

## 公開URL（ずっと使える）

https://00451590.github.io/kasagatake-zaiko/

- PIN（最初）: `1234`
- 追加料金なし（GitHub 無料枠）
- 同じURLをスタッフに共有すればOK

## 使い方

1. 上のURLを開く
2. PIN を入れる
3. 画面上部の「すぐ入力」に打ち込む（Enter で次へ）
4. 在庫は `＋` `−`、発注数もその場で編集
5. 「在庫Excel」「発注Excel」で出力

## ローカル起動

```bash
npm install
npm run dev
```

## 再公開（中身を更新したとき）

```bash
VITE_BASE=/kasagatake-zaiko/ npm run build
# その後 scripts/publish-github-pages.mjs で gh-pages を更新
```
