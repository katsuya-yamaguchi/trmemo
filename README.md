## テックスタック
| 項目            | サービス／技術                                          | 用途・ポイント                                                       |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| フロントエンド       | iOS (Swift/SwiftUI)                              | ユーザー向けネイティブアプリ。REST／GraphQL で API を叩く                         |
| API／サーバレス関数   | Cloudflare Pages Functions（または Workers）          | HTTP エンドポイント、ビジネスロジック、認証ゲート通過後のレスポンス生成                        |
| 認証            | Cloudflare Access (OIDC)                         | Google／任意 IdP 連携。Pages Functions への認証ミドルウェア（Access プラグイン）     |
| リレーショナル DB    | D1 (SQLite ベース)                                  | 軽量な関係データの永続化。アプリごとに DB 分割 or テナントID カラムによるマルチテナント             |
| キー・バリュー／キャッシュ | Workers KV                                       | セッション、機能フラグ、設定値キャッシュ、スロットル管理など                                |
| オブジェクトストレージ   | R2                                               | 画像／動画ファイルなどのバイナリファイル保存。S3 互換 API                              |
| CDN／アセット配信    | Cloudflare CDN                                   | 静的アセットのキャッシュ配信、Edge キャッシュ制御ヘッダー                               |
| セキュリティ        | WAF, Rate Limiting, Bot Management               | OWASP カバー、ブルートフォース防止、クライアント識別によるレート制御                         |
| ロギング／モニタリング   | Logpush, Analytics, Observability                | リクエストログ、エラーログ、パフォーマンス分析 (Browser Insights, Network Analytics) |
| イメージ最適化       | Cloudflare Images, Polish                        | リサイズ・フォーマット変換・圧縮などを Edge で自動化                                 |

## Supabase
プロジェクトの確認方法
```bash
trmemo % npx supabase projects list
Cannot find project ref. Have you run supabase link?

  
   LINKED | ORG ID               | REFERENCE ID         | NAME   | REGION                 | CREATED AT (UTC)    
  --------|----------------------|----------------------|--------|------------------------|---------------------
          | gajxpjusnetiyhmfouqp | xaqcuvlywgajwbntisam | trmemo | Northeast Asia (Tokyo) | 2025-03-12 08:58:17 

trmemo % 
```

## EASを利用したいiOSプラットフォーム向けの開発ビルド
```bash
eas build --profile development --platform ios --clear-cache
```