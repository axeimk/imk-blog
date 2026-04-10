---
title: AI時代だからこそより気をつけたいWebにおける基本的なセキュリティ
description: AIによるコード生成が当たり前になった今、改めて意識すべきWebセキュリティの基本と、AI特有の新しいリスクについてまとめる。
pubDate: 2026-04-08
tags: [security, web]
---

AIエージェントによるコーディングは生産性に多大な貢献をし、私を含め全世界の開発者が夢中になっている一方で、セキュリティの観点では新たな課題が生まれています。[Veracodeの調査](https://www.veracode.com/blog/ai-generated-code-security-risks/)によると、AI生成コードの約45%にセキュリティ上の欠陥が含まれているとのことです。また、[Trend Microのレポート](https://www.trendmicro.com/vinfo/us/security/news/threat-landscape/fault-lines-in-the-ai-ecosystem-trendai-state-of-ai-security-report)では、AIエコシステム全体で2025年にAI関連のCVEが2,130件開示され、前年比34.6%の増加を記録したと報告されています。

この記事では、AI時代において改めて意識すべきWebセキュリティの基本と、AI特有の新しいリスクについて整理します。

## 変わらない脅威: OWASP Top 10の古典的脆弱性

AIがコードを書くようになっても、Webアプリケーションを狙う攻撃の本質は変わっていません。[OWASP Top 10は2025年に更新](https://owasp.org/Top10/2025/)され、依然として以下のような脆弱性がランクインしています。

> **OWASPとは**: OWASP（Open Worldwide Application Security Project）は、Webアプリケーションのセキュリティ向上を目的とした国際的な非営利コミュニティです。中でも「OWASP Top 10」は、最も重大なWebアプリケーションのセキュリティリスクを数年ごとにランキング形式で公開しているドキュメントで、業界標準のリファレンスとして広く参照されています。

| 順位 | カテゴリ | 変化 |
|------|---------|------|
| A01 | Broken Access Control（アクセス制御の不備） | 2025年も1位を維持 |
| A02 | Security Misconfiguration（セキュリティ設定の不備） | 5位から上昇 |
| A03 | Software Supply Chain Failures（サプライチェーンの問題） | 2025年から新規追加 |
| A05 | Injection（SQLインジェクション、XSSなど） | 3位から下降、依然Top 5 |

AI生成コードにおいても、SQLインジェクションやXSSといった古典的なインジェクション系の脆弱性は依然として多く確認されています。AIはデモ向けの緩い設定（許可的なロギング、広範なネットワークバインディング、緩いバリデーション）をそのまま本番コードに持ち込みやすい傾向があります。

### AI生成コードで特に注意すべき古典的脆弱性

**SQLインジェクション**

AIにデータベース操作のコードを頼むと、ユーザー入力をそのままクエリに展開するコードが生成されることがあります。たとえばDrizzle ORMを使っている場合、`sql.raw()`で生の文字列を埋め込んでしまうパターンです。

```typescript
// AIが生成しがちな危険なコード — sql.raw()はエスケープされない
const result = await db.execute(sql`SELECT * FROM users WHERE name = ${sql.raw(userInput)}`);

// Drizzleのクエリビルダを使えばプレースホルダ化される
const result = await db.select().from(users).where(eq(users.name, userInput));
```

**XSS（クロスサイトスクリプティング）**

ユーザー入力をそのままHTMLに埋め込むコードも生成されやすいです。Reactなどのフレームワークはデフォルトでエスケープしてくれますが、`dangerouslySetInnerHTML`のような「抜け道」をAIが安易に使うケースがあります。

**ハードコードされたシークレット**

[GitGuardianの2026レポート](https://www.gitguardian.com/state-of-secrets-sprawl-report-2026)によると、2025年には公開GitHubコミットで2,865万件の新規ハードコードシークレットが検出されました（前年比34%増）。Vibe Codingのアプリケーションでは、APIキーやサービスアカウントの認証情報がクライアントサイドのJavaScriptに露出するケースが頻発しています。

## AIで増幅されたリスク

### プロンプトインジェクション

[OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)で2年連続1位となったのがプロンプトインジェクションです。LLMを組み込んだWebアプリケーションにおいて、悪意のある入力でモデルの挙動を改変する攻撃を指します。

SQLインジェクションとの類似性が興味深いです。SQLインジェクションが「信頼されたSQL命令」と「信頼されていないユーザー入力」の境界が曖昧なことを突くのと同様に、プロンプトインジェクションもアプリケーション側で信頼境界を構造的に分離しなければ、モデル単体ではその境界を強制できないという問題です。つまり、問題の所在はモデルだけでなく、アプリケーションの設計にもあります。

**直接インジェクション**: ユーザーが入力欄から直接モデルの挙動を改変します。

**間接インジェクション**: Webページやファイルなど外部ソースに埋め込まれた命令でモデルを操作します。たとえば、「AIで要約」機能が参照するWebページに隠し命令を埋め込み、要約結果を操作するといった手法です。

関連する攻撃として、Microsoftが2026年2月に報告した「[AI Recommendation Poisoning](https://www.microsoft.com/en-us/security/blog/2026/02/10/ai-recommendation-poisoning/)」があります。これはプロンプトインジェクションの手法を応用しつつ、AIの記憶や推薦システムを継続的に汚染することで、単発の操作よりも長期的な影響を及ぼす持続型の攻撃です。

### Excessive Agency（過剰な権限委譲）

LLMに与える権限が大きすぎると、プロンプトインジェクション等と組み合わさって深刻な被害につながります。メール送信、データベース操作、ファイル削除などの権限をAIエージェントに付与する場合、最小権限の原則を徹底する必要があります。

### サプライチェーンリスクの拡大

サプライチェーンへの攻撃自体は以前からありますが、AIが自動的にオープンソースパッケージを導入することで、脆弱な依存関係や悪意のあるパッケージを取り込むリスクが増幅されています。OWASP Top 10 2025でも「Software Supply Chain Failures」が新たにA03として追加されました。

直近の事例として、2026年3月に発生した[Axiosのサプライチェーン攻撃](https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/)が挙げられます。Axiosは週間7,000万ダウンロードを超えるJavaScriptのHTTPクライアントライブラリですが、メンテナーのnpmアカウントが侵害され、悪意のあるバージョン（1.14.1および0.30.4）が公開されました。これらのバージョンには`plain-crypto-js`という偽の依存パッケージが仕込まれており、インストール時にpostinstallスクリプトが実行され、macOS・Windows・Linuxに対応したRAT（リモートアクセストロイの木馬）がC2サーバーからダウンロードされる仕組みでした。[Microsoftの分析](https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/)では、北朝鮮の脅威アクター（Sapphire Sleet）によるものと報告されています。

この事件は、広く使われているパッケージでも安全とは限らないことを改めて示しました。AIがコード生成時に`npm install axios`を提案すること自体は自然ですが、バージョンの固定やロックファイルの管理、`npm audit`の定期実行といった基本的な対策を怠ると、こうした攻撃の影響をそのまま受けることになります。

また、AIが提案するパッケージが実在するかどうかすら確認が必要なケースもあります。「[Slopsquatting](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/)」と呼ばれる攻撃手法では、AIがハルシネーションで生成しやすい架空のパッケージ名を攻撃者が先回りして登録し、マルウェアを仕込みます。USENIX Security 2025の研究では、テストしたコード生成モデルのサンプルのうち約20%が実在しないパッケージを推薦したと報告されています。

## Vibe Codingの落とし穴

「Vibe Coding」—自然言語のプロンプトだけでアプリケーションを構築するワークフロー—は、特にセキュリティ面でのリスクが大きいです。典型的な失敗パターンを見てみましょう。

### 秘密情報・トークンの露出

AIはAPIキーやトークンをクライアントサイドのコードに直接埋め込むことがあります。環境変数やシークレットマネージャーの利用を指示しなければ、そのまま公開リポジトリにpushされてしまうケースが後を絶ちません。

SSR/Edge環境でも油断できません。React RouterやNext.jsなどのフルスタックフレームワークでは、環境変数のプレフィックスによってサーバー専用かクライアント公開かが決まります（例: Next.jsの`NEXT_PUBLIC_`）。AIがVibe Codingで環境変数を設定する際、このプレフィックスを誤って付与し、サーバー側で留めるべきシークレットがクライアントのバンドルに混入してしまう事故は珍しくありません。

### 認可設定の漏れ

SupabaseやFirebaseなどのBaaSを使う場合、AIはデータアクセス制御の設定を省略しがちです。「動く」コードは生成できても、「誰でもデータを読み書きできる」状態になっていることがあります。

- **Supabase**: PostgreSQLのRLS（Row Level Security）でテーブルごとにポリシーを定義する必要があります。AIが生成するマイグレーションではRLSが無効のままになっていたり、`USING (true)`のような実質的に制限のないポリシーが設定されることがあります。
- **Firebase**: Firestore/Realtime Database/Storageそれぞれに専用のSecurity Rulesを記述する必要があります。AIがクイックスタート向けに`allow read, write: if true;`のような全開放ルールをそのまま残してしまう事例が典型的です。

### 生成コードを理解しないまま本番投入

[Wizの調査で判明した](https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys)Moltbookアプリの事例はその象徴です。本番データベースがインターネット上から閲覧可能な状態になっており、150万件のAPIトークン、35,000件のメールアドレス、プライベートメッセージが露出していました。

動いているからといって安全とは限りません。AIが生成したコードの脆弱性は、従来のテストでは見つけにくいケースも多く、専用のセキュリティスキャンが不可欠です。

## 具体的に何をすべきか

### AI生成コードに対して

1. **AIの出力を信頼しすぎない**: 生成されたコードは必ずレビューしましょう。特にセキュリティに関わる部分（認証、認可、入力バリデーション、暗号化）は重点的に確認します。AIが大量のコードを高速に生成する一方で、人間のレビューがボトルネックになるというジレンマはAI駆動開発における現実的な課題です。それでも、少なくともセキュリティに関わる部分については、現時点では人間の目を通すべきだと考えます
2. **自動スキャンをCI/CDに組み込む**: SAST/DASTツールによるセキュリティスキャンを自動化し、AI生成コードも例外なくチェックします
3. **シークレットスキャニングを導入する**: APIキーやクレデンシャルのハードコードを検出する仕組みを整備します
4. **依存関係を検証する**: AIが提案したパッケージが本当に意図したものか、既知の脆弱性がないかを確認します

### LLMを組み込んだWebアプリに対して

1. **入出力を検証する**: ユーザー入力のバリデーションはもちろん、LLMの出力もそのまま信頼せず、出力先に応じた適切な処理を行います。HTMLに埋め込むならエスケープ、SQLに渡すならパラメータ化クエリ、外部ツール呼び出しに使うなら許可リストによる検証など、コンテキストごとに対策が異なります
2. **最小権限の原則を適用する**: AIエージェントに与える権限を必要最小限にします。高リスクな操作（データ削除、送金など）には人間の承認ステップを入れます
3. **システムプロンプトに機密情報を含めない**: 漏洩リスクを前提に設計します
4. **レート制限を実装する**: 悪用を防ぐための基本的な制御を入れます

### 変わらない基本

AI時代であっても、セキュリティの基本は変わりません。

- 入力は常にバリデーションする
- 出力は適切にエスケープする
- 認証・認可を正しく実装する
- HTTPSを使う
- 依存関係の安全性を確認しつつ、計画的に更新する
- エラーメッセージで内部情報を漏らさない

これらはAI以前から言われ続けてきたことですが、AIがコードを書く時代だからこそ、開発者自身がこれらの原則を理解しているかどうかが問われます。AIが生成したコードの問題点に気づきやすいのは、基本を理解している開発者です。

## おわりに

AIはコーディングの生産性を大きく向上させてくれるツールです。しかし、セキュリティに関しては「AIに任せておけば大丈夫」とはなりません。むしろ、AIが生成するコードの量が増えるほど、レビューやテストの重要性は増していきます。

結局のところ、セキュアなWebアプリケーションを作る責任は開発者にあります。AIはあくまでツールであり、そのツールの出力を評価し、判断するのは人間の仕事です。基本に立ち返り、AIの利便性とセキュリティのバランスを意識して開発に取り組んでいきたいですね。

## 参考

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/)
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Veracode: AI-Generated Code Security Risks](https://www.veracode.com/blog/ai-generated-code-security-risks/)
- [Trend Micro: Fault Lines in the AI Ecosystem](https://www.trendmicro.com/vinfo/us/security/news/threat-landscape/fault-lines-in-the-ai-ecosystem-trendai-state-of-ai-security-report)
- [Georgetown CSET: Cybersecurity Risks of AI-Generated Code](https://cset.georgetown.edu/wp-content/uploads/CSET-Cybersecurity-Risks-of-AI-Generated-Code.pdf)
- [GitGuardian: State of Secrets Sprawl 2026](https://www.gitguardian.com/state-of-secrets-sprawl-report-2026)
- [Microsoft: Mitigating the Axios npm Supply Chain Compromise](https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/)
- [Microsoft: AI Recommendation Poisoning](https://www.microsoft.com/en-us/security/blog/2026/02/10/ai-recommendation-poisoning/)
- [Wiz: Hacking Moltbook](https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys)
