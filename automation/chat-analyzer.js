/**
 * チャット内容解析システム
 * Claude Codeとのチャット内容から機能追加・テスト・変更点を抽出し、
 * 対応するドキュメント更新を自動実行する
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ChatAnalyzer {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.docsPath = path.join(this.projectRoot, 'docs');
        this.chatLogPath = options.chatLogPath || path.join(this.projectRoot, '.claude-chat-log.json');
        this.lastProcessedHash = this.loadLastProcessedHash();
        
        // 解析パターン定義
        this.patterns = {
            featureAddition: [
                /新しい機能|機能追加|機能を追加|実装/i,
                /新規.*実装|実装.*機能/i,
                /feature.*add|add.*feature|implement/i
            ],
            testing: [
                /テスト|test|testing/i,
                /検証|verify|validation/i,
                /テストケース|test case/i
            ],
            bugFix: [
                /バグ修正|bug.*fix|fix.*bug/i,
                /不具合|issue.*fix|修正/i,
                /エラー.*解決|solve.*error/i
            ],
            documentUpdate: [
                /ドキュメント|document|docs/i,
                /README|readme/i,
                /仕様書|specification/i
            ],
            configChange: [
                /設定|config|configuration/i,
                /環境|environment|env/i,
                /セットアップ|setup/i
            ]
        };
    }

    /**
     * チャットログからの変更点抽出
     */
    async analyzeChatContent(chatContent) {
        const changes = {
            features: [],
            tests: [],
            bugs: [],
            docs: [],
            configs: [],
            timestamp: new Date().toISOString()
        };

        const messages = this.parseMessages(chatContent);
        
        for (const message of messages) {
            const analysis = this.analyzeMessage(message);
            this.mergeAnalysis(changes, analysis);
        }

        return changes;
    }

    /**
     * メッセージ解析
     */
    analyzeMessage(message) {
        const result = {
            features: [],
            tests: [],
            bugs: [],
            docs: [],
            configs: []
        };

        const content = message.content.toLowerCase();
        
        // 機能追加の検出
        if (this.matchesPatterns(content, this.patterns.featureAddition)) {
            result.features.push({
                type: 'addition',
                description: this.extractDescription(message.content, this.patterns.featureAddition),
                files: this.extractFileReferences(message.content),
                timestamp: message.timestamp
            });
        }

        // テスト関連の検出
        if (this.matchesPatterns(content, this.patterns.testing)) {
            result.tests.push({
                type: 'test',
                description: this.extractDescription(message.content, this.patterns.testing),
                files: this.extractFileReferences(message.content),
                timestamp: message.timestamp
            });
        }

        // バグ修正の検出
        if (this.matchesPatterns(content, this.patterns.bugFix)) {
            result.bugs.push({
                type: 'fix',
                description: this.extractDescription(message.content, this.patterns.bugFix),
                files: this.extractFileReferences(message.content),
                timestamp: message.timestamp
            });
        }

        // 設定変更の検出
        if (this.matchesPatterns(content, this.patterns.configChange)) {
            result.configs.push({
                type: 'config',
                description: this.extractDescription(message.content, this.patterns.configChange),
                files: this.extractFileReferences(message.content),
                timestamp: message.timestamp
            });
        }

        return result;
    }

    /**
     * パターンマッチング
     */
    matchesPatterns(content, patterns) {
        return patterns.some(pattern => pattern.test(content));
    }

    /**
     * 説明文の抽出
     */
    extractDescription(content, patterns) {
        const lines = content.split('\n');
        for (const line of lines) {
            if (patterns.some(pattern => pattern.test(line))) {
                return line.trim().substring(0, 200);
            }
        }
        return content.substring(0, 200);
    }

    /**
     * ファイル参照の抽出
     */
    extractFileReferences(content) {
        const filePatterns = [
            /[\w\-./]+\.(js|ts|jsx|tsx|py|md|json|html|css|scss)/g,
            /`([^`]+\.(js|ts|jsx|tsx|py|md|json|html|css|scss))`/g,
            /docs\/[\w\-./]+/g
        ];

        const files = new Set();
        
        for (const pattern of filePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const cleanMatch = match.replace(/`/g, '');
                    if (cleanMatch.includes('/') || cleanMatch.includes('.')) {
                        files.add(cleanMatch);
                    }
                });
            }
        }

        return Array.from(files);
    }

    /**
     * メッセージパース
     */
    parseMessages(chatContent) {
        // Claude Codeのチャット形式を想定
        const messages = [];
        const lines = chatContent.split('\n');
        let currentMessage = null;

        for (const line of lines) {
            if (line.startsWith('Human:') || line.startsWith('Assistant:')) {
                if (currentMessage) {
                    messages.push(currentMessage);
                }
                currentMessage = {
                    role: line.startsWith('Human:') ? 'user' : 'assistant',
                    content: line.substring(line.indexOf(':') + 1).trim(),
                    timestamp: new Date().toISOString()
                };
            } else if (currentMessage) {
                currentMessage.content += '\n' + line;
            }
        }

        if (currentMessage) {
            messages.push(currentMessage);
        }

        return messages;
    }

    /**
     * 解析結果のマージ
     */
    mergeAnalysis(target, source) {
        Object.keys(source).forEach(key => {
            if (Array.isArray(target[key]) && Array.isArray(source[key])) {
                target[key].push(...source[key]);
            }
        });
    }

    /**
     * 最後に処理したハッシュの読み込み
     */
    loadLastProcessedHash() {
        const hashFile = path.join(this.projectRoot, '.claude-last-hash');
        try {
            if (fs.existsSync(hashFile)) {
                return fs.readFileSync(hashFile, 'utf8').trim();
            }
        } catch (error) {
            console.warn('前回のハッシュ読み込みに失敗:', error.message);
        }
        return null;
    }

    /**
     * 処理済みハッシュの保存
     */
    saveLastProcessedHash(hash) {
        const hashFile = path.join(this.projectRoot, '.claude-last-hash');
        try {
            fs.writeFileSync(hashFile, hash);
        } catch (error) {
            console.error('ハッシュ保存に失敗:', error.message);
        }
    }

    /**
     * コンテンツハッシュの計算
     */
    calculateContentHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * 新しい変更のチェック
     */
    hasNewChanges(content) {
        const currentHash = this.calculateContentHash(content);
        const hasChanges = currentHash !== this.lastProcessedHash;
        if (hasChanges) {
            this.saveLastProcessedHash(currentHash);
        }
        return hasChanges;
    }
}

module.exports = ChatAnalyzer;