# Dify Knowledge Base 設定ガイド

## 🎯 目的
Dify Knowledge Baseに社内データをアップロードして、AIによる検索機能を実現する

## 📋 事前準備
- Difyアカウント: ✅ 既存（GitHub連携済み）
- ワークスペース: ✅ 「Dify's Workspace」
- APIキー: ✅ `app-fOpZcklIbAygUiotfGdH58zY`

## 🔧 設定手順

### Step 1: Dify管理画面にログイン
```
1. https://dify.ai/ にアクセス
2. GitHubアカウントでログイン
3. 「Dify's Workspace」を選択
```

### Step 2: Knowledge Base作成
```
1. 左メニューから「Knowledge」をクリック
2. 「Create Knowledge Base」ボタンをクリック
3. 設定項目:
   - Name: frontoffice-data
   - Description: フロントオフィス社内データ検索用
   - Visibility: Private
```

### Step 3: サンプルデータのアップロード

#### アップロードするファイル（GitHubからダウンロード）
```
https://github.com/horiken1977/frontoffice/tree/main/docs/sample-data/

1. customer-info.csv
   - 顧客情報（10社のデータ）
   - 業界、予算、課題等を含む

2. product-catalog.md
   - 商品カタログ情報
   - 価格、機能、導入実績等

3. competitive-analysis.md
   - 競合分析データ
   - Salesforce、HubSpot等との比較
```

#### アップロード手順
```
1. Knowledge Base作成後「Add Document」をクリック
2. 「Upload from computer」を選択
3. 上記3ファイルを順次アップロード
4. 各ファイルの「Process」ボタンをクリック
5. 処理完了まで待機（通常1-3分）
```

### Step 4: Knowledge Base設定の確認
```
1. 「Settings」タブをクリック
2. 以下を確認:
   - Retrieval Model: デフォルト設定でOK
   - Chunk Size: 500 (推奨)
   - Chunk Overlap: 50 (推奨)
   - Search Method: Vector Search (推奨)
```

### Step 5: テスト検索
```
1. 「Query」タブをクリック
2. テストクエリを入力:
   - "製造業の顧客情報"
   - "AI営業アシスタントの価格"
   - "Salesforceとの比較"
3. 正常に結果が返されることを確認
```

## 🔗 アプリケーションとの連携

### 既存設定の活用
```javascript
// 既に設定済み
const API_KEY = 'app-fOpZcklIbAygUiotfGdH58zY';
const ENDPOINT = 'https://api.dify.ai/v1/chat-messages';
```

### Knowledge Baseの統合
Knowledge Baseが作成されると、既存のチャットAPIが自動的に新しいデータソースを参照します。追加設定は不要です。

## 📊 動作確認

### Webアプリケーションでの確認
```
1. https://horiken1977.github.io/frontoffice/data-search.html にアクセス
2. 検索ボックスに以下を入力してテスト:
   - "製造業の顧客で予算1000万円以上"
   - "AI営業アシスタントの機能"
   - "Salesforceより安い理由"
3. AI検索結果が表示されることを確認
```

### 期待される検索結果例
```
入力: "製造業の顧客で予算1000万円以上"

期待される出力:
📊 社内データ検索結果:

**製造業ジャパン株式会社**
- 従業員: 1,200名
- 売上: 300億円  
- 予算: 5,000万円
- 課題: 生産性向上・品質管理
- 導入時期: 2025年Q4

**推奨商品**: 製造業特化 MES連携パッケージ（月額150万円〜）
```

## 🎯 追加データの登録

### お客様独自データの追加方法
```
1. Dify Knowledge Base管理画面
2. 「Add Document」から追加ファイルをアップロード
3. 対応形式:
   - CSV (顧客情報、案件情報等)
   - Excel (売上データ、分析結果等)  
   - PDF (提案書、契約書等)
   - Word (議事録、報告書等)
   - Markdown (商品情報、FAQ等)
```

### データ更新のベストプラクティス
```
- 定期更新: 月1回程度
- ファイル命名: 日付を含める（customer_2025_01.csv等）
- 古いデータ: 定期的に削除または更新
- バックアップ: 重要データは複数形式で保存
```

## ⚠️ 注意事項

### セキュリティ
```
- Knowledge Baseは「Private」設定を維持
- APIキーは外部に漏洩させない
- 機密データは適切にマスキング
```

### 制限事項
```
- ファイルサイズ: 1ファイル50MBまで
- 合計容量: プランに依存
- 同時検索: 一般的な利用では問題なし
```

### トラブルシューティング
```
問題: Knowledge Baseにアクセスできない
→ ワークスペースとAPIキーを確認

問題: 検索結果が空
→ ファイルの処理完了を確認

問題: 検索精度が低い
→ データの追加や検索クエリの改善
```

## 📈 次のステップ

### Phase 2準備
```
1. n8n統合の検討
2. 複数AI（OpenAI、Claude）の活用
3. ワークフロー自動化
4. API統合の拡張
```

### 運用改善
```
1. 検索ログの分析
2. よく使われるクエリの特定
3. データ充実化
4. ユーザーフィードバックの収集
```

---

**🎉 設定完了後、AIによる社内データ検索が利用可能になります！**