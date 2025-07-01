# Dify Knowledge Base トラブルシューティング

## 🚨 問題: AIが「社内データベースにアクセスできません」と応答

### 原因
DifyのAIアプリケーションがKnowledge Baseと正しく連携されていない

## 🔧 解決手順

### Step 1: Knowledge Baseの状態確認
```
1. Dify管理画面にログイン
2. 「Knowledge」メニューで「frontoffice-data」を確認
3. ファイル処理状態を確認:
   ✅ customer-info.csv: Status = "Processed"
   ✅ product-catalog.md: Status = "Processed"  
   ✅ competitive-analysis.md: Status = "Processed"
```

### Step 2: 新しいAIアプリケーションの作成
**重要**: 既存のMVPアプリではなく、Knowledge Base用の新しいアプリを作成する必要があります。

```
1. Dify管理画面の「Apps」メニューをクリック
2. 「Create from scratch」を選択
3. 設定内容:
   - App name: frontoffice-knowledge-search
   - App type: Chat App
   - Model: GPT-3.5-turbo または Gemini Pro
```

### Step 3: Knowledge Baseとの連携設定
```
1. 新しく作成したアプリの編集画面を開く
2. 左メニューの「Context」をクリック
3. 「Add Context」→「Knowledge Base」を選択
4. 「frontoffice-data」を選択して追加
5. 設定:
   - Retrieval mode: Vector Search
   - Top K: 5
   - Score threshold: 0.5
```

### Step 4: システムプロンプトの設定
```
「Instructions」セクションに以下を設定:

あなたは営業・マーケティング支援AIアシスタントです。
社内のKnowledge Baseから関連情報を検索して、以下の業務をサポートしてください：

1. 顧客情報の検索・分析
2. 商品・サービス情報の提供
3. 競合比較分析
4. 営業提案の作成支援

Knowledge Baseには以下のデータが含まれています：
- 顧客情報（業界、予算、課題、導入時期等）
- 商品カタログ（価格、機能、導入実績等）
- 競合分析（他社比較、差別化ポイント等）

ユーザーからの質問に対して、関連するデータを検索し、具体的で実用的な回答を提供してください。
データが見つからない場合は、その旨を伝えた上で一般的なアドバイスを提供してください。
```

### Step 5: 新しいAPIキーの取得
```
1. アプリ設定画面の「API Access」をクリック
2. 新しいAPIキーをコピー（app-xxxxxxxxxxxxxxxx形式）
3. このAPIキーを記録
```

## 🔄 Webアプリケーションの更新

### APIキーの更新が必要
新しく作成したアプリのAPIキーに変更する必要があります。

### テスト手順
```
1. 新しいAPIキーでWebアプリケーションを更新
2. 以下のテストクエリで動作確認:
   - "製造業の顧客リスト"
   - "AI営業アシスタントの価格"
   - "Salesforceとの比較"
```

## 💡 追加の確認ポイント

### Knowledge Baseの品質確認
```
1. Dify Knowledge Base管理画面で「Query」タブをクリック
2. 直接検索テスト:
   - "製造業" → 製造業ジャパンの情報が表示されるか
   - "営業アシスタント" → 商品情報が表示されるか
   - "競合" → 競合分析情報が表示されるか
```

### データ形式の最適化
```
Knowledge Baseでの検索精度を向上させるため、データを以下の形式に最適化:

customer-info.csv → customer-info-optimized.csv
- より詳細な説明文を追加
- キーワードを豊富に含める
- 構造化された形式に統一
```

## 🎯 期待される動作

### 修正後の検索例
```
入力: "製造業で予算1000万円以上の顧客"

期待される出力:
📊 社内データ検索結果:

製造業ジャパン株式会社
- 業界: 製造業
- 従業員数: 1,200名
- 売上規模: 300億円
- 予算: 5,000万円
- 課題: 生産性向上・品質管理
- 担当者: 高橋美咲 (takahashi@manufacturing-jp.co.jp)
- 導入時期: 2025年Q4

この顧客には「製造業特化 MES連携パッケージ（月額150万円〜）」が適しています。
```

## ⚠️ よくある問題

### 問題1: Knowledge Baseが表示されない
→ ファイルの処理が完了していない可能性。再アップロードを試す。

### 問題2: 検索結果が不正確
→ システムプロンプトの調整とデータの追加が必要。

### 問題3: APIエラー
→ 新しいアプリのAPIキーを使用しているか確認。

---

**次のアクション**: 
1. 新しいAIアプリケーションの作成
2. Knowledge Base連携の設定
3. 新しいAPIキーの取得と適用