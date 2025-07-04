# Claude Code ドキュメント自動更新システム

このシステムは、Claude Codeとのチャット内容を解析し、機能追加・テスト・バグ修正などの開発活動を自動的に検出してドキュメントを更新します。

## 機能概要

- **チャット解析**: Claude Codeとの会話から開発活動を自動抽出
- **ドキュメント更新**: 解析結果に基づいてドキュメントを自動更新
- **Gitフック連動**: コミット・プッシュ時の自動実行
- **設定可能**: パターンや対象ドキュメントをカスタマイズ可能

## ファイル構成

```
automation/
├── main.js              # メインエントリーポイント
├── chat-analyzer.js     # チャット内容解析エンジン
├── doc-updater.js       # ドキュメント更新エンジン
├── config.json          # 設定ファイル
├── package.json         # Node.jsパッケージ定義
└── README.md           # このファイル
```

## セットアップ

### 1. Node.js環境の確認
```bash
node --version  # v14.0.0 以上が必要
```

### 2. Gitフックの有効化
```bash
cd automation
npm run install-hooks
```

### 3. 設定の確認
```bash
npm run validate-config
```

## 使用方法

### 自動実行（推奨）
Gitフックにより、以下のタイミングで自動実行されます：
- **post-commit**: コミット後にチャット内容を解析してドキュメント更新
- **pre-push**: プッシュ前に最新のチャット内容で同期

### 手動実行
```bash
# 手動でドキュメント更新
npm run manual-update

# プッシュ前同期
npm run sync-docs

# カスタムチャットログファイルを指定
node main.js --source=path/to/chat.log --auto-update
```

## 検出される開発活動

### 機能追加
- キーワード: "新しい機能", "機能追加", "実装", "feature add", "implement"
- 更新対象: development-log.md, feature-changelog.md, implementation-status.md

### テスト
- キーワード: "テスト", "test", "検証", "verify", "validation"
- 更新対象: development-log.md, test-results.md

### バグ修正
- キーワード: "バグ修正", "bug fix", "不具合", "修正"
- 更新対象: development-log.md, feature-changelog.md

### 設定変更
- キーワード: "設定", "config", "環境", "setup"
- 更新対象: development-log.md, implementation-status.md

## 生成されるドキュメント

### `docs/development-log.md`
すべての開発活動の時系列ログ

### `docs/feature-changelog.md`
機能追加・修正の変更履歴（バージョン管理）

### `docs/test-results.md`
テスト実行結果の記録

### `docs/implementation-status.md`
実装ステータスの一覧

### `CLAUDE.md`
Claude Codeとの作業記録（自動更新ログ付き）

## 設定カスタマイズ

`config.json`で以下をカスタマイズできます：

- **解析パターン**: キーワードと重み付け
- **対象ドキュメント**: 更新するファイルとカテゴリ
- **Gitフック**: 自動コミット設定
- **ログ設定**: ログレベルとファイル出力
- **セキュリティ**: 制限パスとサニタイズ

## トラブルシューティング

### チャットログが見つからない場合
1. 環境変数 `CLAUDE_CHAT_CONTENT` を設定
2. `.claude-chat-log.json` ファイルを作成
3. Claude Codeのログディレクトリを確認

### Gitフックが動作しない場合
```bash
# フック実行権限の確認
ls -la .git/hooks/

# 手動で権限設定
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/pre-push
```

### Node.jsエラーの場合
```bash
# Node.jsバージョン確認
node --version

# パッケージの再インストール
cd automation
npm install
```

## 開発者向け情報

### 新しい検出パターンの追加
`config.json`の`analysisPatterns`セクションに追加：

```json
{
  "analysisPatterns": {
    "newCategory": {
      "keywords": ["キーワード1", "キーワード2"],
      "weight": 1.0
    }
  }
}
```

### カスタムドキュメントテンプレート
`doc-updater.js`の`documentTemplates`に新しいテンプレート関数を追加

## ライセンス

MIT License

## サポート

問題や要望は、プロジェクトのIssueトラッカーに報告してください。