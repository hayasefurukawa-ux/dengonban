# ゆっくり駅伝言板

Google AI Studio からエクスポートした「駅の伝言板」Webアプリです。  
Firebase Firestore に伝言・プロフィール・管理人メッセージを保存します。

## 必要なもの

- [Node.js](https://nodejs.org/) 18 以上（推奨: 20 LTS）

## セットアップ

1. 依存関係をインストールします。

```bash
npm install
```

2. 環境変数ファイルを用意します（初回のみ）。

```bash
cp .env.example .env.local
```

Firebase の接続情報は `firebase-applet-config.json` に含まれています（AI Studio 連携分）。

## 起動（開発）

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

ターミナルに次が出れば成功です。

```
[Firebase] Firestore connected successfully.
[Station Board Server] Running on http://localhost:3000
```

サーバー起動中はターミナルが止まったように見えますが正常です。止めるときは `Ctrl + C` です。

## 本番ビルド

```bash
npm run build
npm start
```

## 主な機能

- 黒板伝言板（最大 20 件 / 1 人あたり最大 2 件）
- 参加者の自己紹介ボード（Substack 連携欄あり）
- 管理人の一言コーナー
- Firebase Firestore への永続保存
- リアルタイム更新（Firestore の購読）

## 元アプリ

AI Studio: https://ai.studio/apps/d4a9e492-2f31-4833-a5f9-787814073aae
