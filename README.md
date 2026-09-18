# 4人オンライン麻雀（Supabase版）

Firebaseを使わず、Supabase Realtime + GitHub Pagesで動かす賭けなしのブラウザゲームです。

## 1. Supabase
1. Supabaseで無料プロジェクトを作成。
2. SQL Editorを開く。
3. `schema.sql` の内容を全部貼り付けて実行。
4. Database > Replication から `mahjong_rooms` をRealtime対象に追加。
5. Authentication > Providersで Anonymous Sign-Ins を有効化。
6. Project URL と Publishable key を確認。

SupabaseのFreeプランにはRealtimeの無料枠があります。小規模な友達同士の利用を想定しています。

## 2. supabase.js
次の2つを自分の値に変更します。

window.SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY";

service_role / secret key は絶対にブラウザ側へ入れないでください。

## 3. GitHub Pages
このフォルダのファイルをGitHubの公開リポジトリへアップロードし、Settings > PagesでDeploy from branchを選びます。

公開されたURLを友達へ送れば、PC・スマホから同じ部屋に参加できます。

## 現在の実装
- 4人部屋
- 部屋ID / 招待URL
- 匿名ユーザー
- 13枚配牌
- ツモ
- 打牌
- 手番同期
- 点数表示
- PC / スマホ対応

未実装:
- チー / ポン / カン
- リーチ
- ロン / ツモ和了
- 役判定
- 正式な符・点数計算
- 局・半荘進行
- 切断復帰などの高度な同期処理

※賭け・金銭・換金要素はありません。
