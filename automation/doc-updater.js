/**
 * ドキュメント自動更新エンジン
 * チャット解析結果に基づいてドキュメントを自動更新
 */

const fs = require('fs');
const path = require('path');
const ChatAnalyzer = require('./chat-analyzer');

class DocumentUpdater {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.docsPath = path.join(this.projectRoot, 'docs');
        this.chatAnalyzer = new ChatAnalyzer(options);
        
        // ドキュメントテンプレート定義
        this.documentTemplates = {
            'development-log.md': this.developmentLogTemplate,
            'feature-changelog.md': this.featureChangelogTemplate,
            'test-results.md': this.testResultsTemplate,
            'implementation-status.md': this.implementationStatusTemplate
        };

        // 更新対象ファイルの設定
        this.updateTargets = {
            features: ['development-log.md', 'feature-changelog.md', 'implementation-status.md'],
            tests: ['development-log.md', 'test-results.md'],
            bugs: ['development-log.md', 'feature-changelog.md'],
            configs: ['development-log.md', 'implementation-status.md']
        };
    }

    /**
     * メイン更新処理
     */
    async updateDocuments(chatContent) {
        try {
            // 新しい変更があるかチェック
            if (!this.chatAnalyzer.hasNewChanges(chatContent)) {
                console.log('新しい変更はありません。');
                return { updated: false, reason: 'No new changes detected' };
            }

            // チャット内容解析
            const analysis = await this.chatAnalyzer.analyzeChatContent(chatContent);
            
            // 各カテゴリの変更を処理
            const updates = await this.processAnalysis(analysis);
            
            // CLAUDE.mdの更新
            await this.updateClaudeLog(analysis, updates);
            
            // インデックスファイルの更新
            await this.updateDocumentIndex();

            return {
                updated: true,
                analysis,
                updates,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('ドキュメント更新エラー:', error);
            throw error;
        }
    }

    /**
     * 解析結果の処理
     */
    async processAnalysis(analysis) {
        const updates = {};

        for (const [category, items] of Object.entries(analysis)) {
            if (category === 'timestamp' || !Array.isArray(items) || items.length === 0) {
                continue;
            }

            updates[category] = [];
            const targetDocs = this.updateTargets[category] || [];

            for (const targetDoc of targetDocs) {
                try {
                    const updateResult = await this.updateDocument(targetDoc, category, items);
                    updates[category].push({
                        document: targetDoc,
                        result: updateResult
                    });
                } catch (error) {
                    console.error(`${targetDoc}の更新に失敗:`, error);
                    updates[category].push({
                        document: targetDoc,
                        error: error.message
                    });
                }
            }
        }

        return updates;
    }

    /**
     * 個別ドキュメント更新
     */
    async updateDocument(docName, category, items) {
        const docPath = path.join(this.docsPath, docName);
        
        // ドキュメントが存在しない場合は作成
        if (!fs.existsSync(docPath)) {
            await this.createDocument(docPath, docName);
        }

        const content = fs.readFileSync(docPath, 'utf8');
        const updatedContent = await this.applyUpdates(content, docName, category, items);
        
        if (content !== updatedContent) {
            fs.writeFileSync(docPath, updatedContent);
            return { updated: true, itemsAdded: items.length };
        }
        
        return { updated: false, reason: 'No changes needed' };
    }

    /**
     * ドキュメント作成
     */
    async createDocument(docPath, docName) {
        const template = this.documentTemplates[docName];
        if (template) {
            const content = template.call(this);
            fs.writeFileSync(docPath, content);
        } else {
            // デフォルトテンプレート
            const content = this.defaultDocumentTemplate(docName);
            fs.writeFileSync(docPath, content);
        }
    }

    /**
     * 更新内容の適用
     */
    async applyUpdates(content, docName, category, items) {
        switch (docName) {
            case 'development-log.md':
                return this.updateDevelopmentLog(content, category, items);
            case 'feature-changelog.md':
                return this.updateFeatureChangelog(content, category, items);
            case 'test-results.md':
                return this.updateTestResults(content, category, items);
            case 'implementation-status.md':
                return this.updateImplementationStatus(content, category, items);
            default:
                return this.updateGenericDocument(content, category, items);
        }
    }

    /**
     * 開発ログの更新
     */
    updateDevelopmentLog(content, category, items) {
        const timestamp = new Date().toISOString().split('T')[0];
        const newEntries = items.map(item => {
            return `### ${timestamp} - ${this.getCategoryLabel(category)}\n` +
                   `**説明:** ${item.description}\n` +
                   (item.files.length > 0 ? `**対象ファイル:** ${item.files.join(', ')}\n` : '') +
                   `**タイムスタンプ:** ${item.timestamp}\n\n`;
        }).join('');

        // "## 最新の変更履歴" セクションを探して挿入
        const sectionPattern = /## 最新の変更履歴\n/;
        if (sectionPattern.test(content)) {
            return content.replace(sectionPattern, `## 最新の変更履歴\n\n${newEntries}`);
        } else {
            return content + `\n\n## 最新の変更履歴\n\n${newEntries}`;
        }
    }

    /**
     * 機能変更ログの更新
     */
    updateFeatureChangelog(content, category, items) {
        const version = this.generateVersionNumber();
        const timestamp = new Date().toISOString().split('T')[0];
        
        const newEntries = `## ${version} (${timestamp})\n\n` +
            items.map(item => `- **${this.getCategoryLabel(category)}:** ${item.description}`).join('\n') +
            '\n\n';

        // changelogの先頭に新しいエントリを追加
        const headerPattern = /(# 機能変更履歴\n\n)/;
        if (headerPattern.test(content)) {
            return content.replace(headerPattern, `$1${newEntries}`);
        } else {
            return `# 機能変更履歴\n\n${newEntries}${content}`;
        }
    }

    /**
     * テスト結果の更新
     */
    updateTestResults(content, category, items) {
        const timestamp = new Date().toISOString();
        const newResults = items.map(item => {
            return `### テスト実行: ${timestamp}\n` +
                   `**詳細:** ${item.description}\n` +
                   `**対象:** ${item.files.join(', ') || 'システム全体'}\n` +
                   `**ステータス:** 実行済み\n\n`;
        }).join('');

        return content.replace(
            /(## 最新のテスト結果\n)/,
            `$1\n${newResults}`
        ) || content + `\n\n## 最新のテスト結果\n\n${newResults}`;
    }

    /**
     * 実装ステータスの更新
     */
    updateImplementationStatus(content, category, items) {
        const updates = items.map(item => {
            const status = category === 'features' ? '実装済み' : 
                          category === 'bugs' ? '修正済み' : 
                          category === 'configs' ? '設定済み' : '完了';
            
            return `- ${item.description} - **${status}** (${new Date().toISOString().split('T')[0]})`;
        }).join('\n');

        const sectionPattern = /## 実装ステータス\n/;
        if (sectionPattern.test(content)) {
            return content.replace(sectionPattern, `## 実装ステータス\n\n${updates}\n\n`);
        } else {
            return content + `\n\n## 実装ステータス\n\n${updates}\n\n`;
        }
    }

    /**
     * CLAUDE.mdの更新
     */
    async updateClaudeLog(analysis, updates) {
        const claudePath = path.join(this.projectRoot, 'CLAUDE.md');
        
        if (!fs.existsSync(claudePath)) {
            console.log(`⚠️  CLAUDE.mdが見つかりません: ${claudePath}`);
            return;
        }

        const content = fs.readFileSync(claudePath, 'utf8');
        const timestamp = new Date().toISOString();
        
        const newLogEntry = `\n## 自動更新ログ - ${timestamp.split('T')[0]}\n\n` +
            `**更新時刻:** ${timestamp}\n` +
            `**検出された変更:**\n` +
            Object.entries(analysis).map(([key, items]) => {
                if (key === 'timestamp' || !Array.isArray(items) || items.length === 0) return '';
                return `- ${this.getCategoryLabel(key)}: ${items.length}件`;
            }).filter(Boolean).join('\n') + '\n\n' +
            `**更新されたドキュメント:**\n` +
            Object.entries(updates).map(([category, docs]) => {
                return docs.map(doc => `- ${doc.document} (${category})`).join('\n');
            }).filter(Boolean).join('\n') + '\n';

        const updatedContent = content + newLogEntry;
        fs.writeFileSync(claudePath, updatedContent);
        
        // ターミナルに記録完了を出力
        console.log('✅ CLAUDE.md更新完了');
        console.log(`📝 記録時刻: ${timestamp}`);
        console.log(`📊 検出変更: ${Object.entries(analysis).filter(([key, items]) => 
            key !== 'timestamp' && Array.isArray(items) && items.length > 0
        ).length}カテゴリ`);
        console.log(`📁 更新ファイル: ${Object.values(updates).flat().length}件`);
    }

    /**
     * ドキュメントインデックスの更新
     */
    async updateDocumentIndex() {
        const indexPath = path.join(this.docsPath, 'index.md');
        
        // docsディレクトリが存在しない場合は作成
        if (!fs.existsSync(this.docsPath)) {
            fs.mkdirSync(this.docsPath, { recursive: true });
        }
        
        const docs = fs.readdirSync(this.docsPath)
            .filter(file => file.endsWith('.md'))
            .sort();

        const indexContent = `# ドキュメントインデックス\n\n` +
            `最終更新: ${new Date().toISOString()}\n\n` +
            `## 利用可能なドキュメント\n\n` +
            docs.map(doc => `- [${doc}](./${doc})`).join('\n') + '\n';

        fs.writeFileSync(indexPath, indexContent);
    }

    /**
     * ユーティリティメソッド
     */
    getCategoryLabel(category) {
        const labels = {
            features: '機能追加',
            tests: 'テスト',
            bugs: 'バグ修正',
            docs: 'ドキュメント',
            configs: '設定変更'
        };
        return labels[category] || category;
    }

    generateVersionNumber() {
        const now = new Date();
        return `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`;
    }

    /**
     * ドキュメントテンプレート
     */
    developmentLogTemplate() {
        return `# 開発ログ

このファイルは自動生成されます。チャット内容から抽出された開発活動が記録されます。

## 最新の変更履歴

(ここに自動的に変更内容が追加されます)
`;
    }

    featureChangelogTemplate() {
        return `# 機能変更履歴

このファイルは自動生成されます。機能追加・修正の履歴が記録されます。

`;
    }

    testResultsTemplate() {
        return `# テスト結果

このファイルは自動生成されます。テスト実行結果が記録されます。

## 最新のテスト結果

(ここに自動的にテスト結果が追加されます)
`;
    }

    implementationStatusTemplate() {
        return `# 実装ステータス

このファイルは自動生成されます。実装の進捗状況が記録されます。

## 実装ステータス

(ここに自動的に実装状況が追加されます)
`;
    }

    defaultDocumentTemplate(docName) {
        return `# ${docName.replace('.md', '').replace('-', ' ').toUpperCase()}

このファイルは自動生成されました。

最終更新: ${new Date().toISOString()}
`;
    }

    /**
     * 汎用ドキュメント更新
     */
    updateGenericDocument(content, category, items) {
        const newContent = items.map(item => 
            `- ${item.description} (${new Date().toISOString().split('T')[0]})`
        ).join('\n');

        return content + `\n\n## ${this.getCategoryLabel(category)}\n\n${newContent}\n`;
    }
}

module.exports = DocumentUpdater;