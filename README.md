# 供養ログ

axeimk による日本語の技術ブログ風チラシの裏。Astro v6 + Tailwind CSS v4 で構築し、GitHub Pages にデプロイする静的サイト。

**URL:** https://blog.axeimk.dev/

## 技術スタック

| 項目 | 内容 |
| :--- | :--- |
| フレームワーク | Astro v6 |
| スタイリング | Tailwind CSS v4 |
| 言語 | TypeScript |
| デプロイ | GitHub Actions → GitHub Pages |
| Node.js | >= 22.12.0 |

## 主な機能

- ダーク / ライトモード切替
- タグによる記事分類・一覧ページ
- RSS フィード (`/rss.xml`)
- サイトマップ自動生成
- ドラフト記事（`draft: true` でビルド除外）

## プロジェクト構成

```text
/
├── .github/workflows/deploy.yml   # GitHub Pages へのデプロイ
├── public/                        # 静的アセット (favicon, CNAME)
└── src/
    ├── components/                # 共通コンポーネント
    ├── content/blog/              # Markdown 記事
    ├── content.config.ts          # コンテンツスキーマ定義
    ├── layouts/                   # BaseLayout, PostLayout
    ├── pages/                     # ルーティング
    └── styles/global.css          # テーマ変数・ダークモード定義
```

## コマンド

```bash
npm run dev           # 開発サーバー起動 (localhost:4321)
npm run build         # 本番ビルド (./dist/)
npm run preview       # ビルド結果のプレビュー
npm run lint          # ESLint
npm run format        # Prettier フォーマット
```

## 記事の追加

`src/content/blog/` に Markdown ファイルを作成する。

```markdown
---
title: "記事タイトル"
description: "記事の概要"
pubDate: 2026-01-01
tags: ["tag1", "tag2"]   # 任意
draft: true              # 任意: true にするとビルド除外
heroImage: "./hero.png"  # 任意
---

本文...
```

| フィールド | 必須 | 説明 |
| :--- | :---: | :--- |
| `title` | ○ | 記事タイトル |
| `description` | ○ | 記事の概要 |
| `pubDate` | ○ | 公開日 |
| `updatedDate` | - | 更新日 |
| `tags` | - | タグの配列 |
| `draft` | - | `true` でビルド除外 |
| `heroImage` | - | アイキャッチ画像 |

## デプロイ

`main` ブランチへのプッシュで GitHub Actions が自動実行され、GitHub Pages にデプロイされる。カスタムドメインは `public/CNAME` で設定。
