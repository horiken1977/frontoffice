#!/usr/bin/env node

/**
 * Claude Code ドキュメント自動更新システム メインエントリーポイント
 */

const fs = require('fs');
const path = require('path');
const DocumentUpdater = require('./doc-updater');

class AutomationMain {
    constructor() {
        this.projectRoot = process.cwd();
        this.docUpdater = new DocumentUpdater({ projectRoot: this.projectRoot });
        this.args = this.parseArguments();
    }

    parseArguments() {
        const args = {
            source: null,
            autoUpdate: false,
            prePushSync: false,
            verbose: false,
            help: false
        };

        process.argv.slice(2).forEach(arg => {
            if (arg.startsWith('--source=')) {
                args.source = arg.split('=')[1];
            } else if (arg === '--auto-update') {
                args.autoUpdate = true;
            } else if (arg === '--pre-push-sync') {
                args.prePushSync = true;
            } else if (arg === '--verbose' || arg === '-v') {
                args.verbose = true;
            } else if (arg === '--help' || arg === '-h') {
                args.help = true;
            }
        });

        return args;
    }

    showHelp() {
        console.log(`
Claude Code ドキュメント自動更新システム

使用方法:
  node main.js [オプション]

オプション:
  --source=<file>     チャットログファイルのパスを指定
  --auto-update       自動更新モード（Gitフックからの呼び出し用）
  --pre-push-sync     プッシュ前同期モード
  --verbose, -v       詳細ログを出力
  --help, -h          このヘルプを表示

例:
  node main.js --source=chat.log --auto-update
  node main.js --pre-push-sync --verbose
        `);
    }

    async run() {
        try {
            if (this.args.help) {
                this.showHelp();
                return 0;
            }

            if (this.args.prePushSync) {
                return await this.prePushSync();
            }

            if (this.args.autoUpdate) {
                return await this.autoUpdate();
            }

            // デフォルト実行
            return await this.defaultRun();

        } catch (error) {
            console.error('実行エラー:', error.message);
            if (this.args.verbose) {
                console.error(error.stack);
            }
            return 1;
        }
    }

    async autoUpdate() {
        this.log('自動更新モードで実行中...');
        
        const chatLogFile = this.args.source || this.findChatLogFile();
        if (!chatLogFile) {
            this.log('チャットログファイルが見つかりません。');
            return 0;
        }

        const chatContent = this.readChatLog(chatLogFile);
        if (!chatContent) {
            this.log('チャット内容が空です。');
            return 0;
        }

        const result = await this.docUpdater.updateDocuments(chatContent);
        
        if (result.updated) {
            this.log(`ドキュメントが更新されました: ${JSON.stringify(result.updates, null, 2)}`);
            return 0;
        } else {
            this.log(`更新なし: ${result.reason}`);
            return 0;
        }
    }

    async prePushSync() {
        this.log('プッシュ前同期を実行中...');
        
        // 環境変数またはClaudeのAPIからチャット内容を取得を試行
        const chatContent = this.getChatContentFromEnvironment() || 
                           await this.getChatContentFromClaudeAPI() ||
                           this.readLatestChatLog();

        if (!chatContent) {
            this.log('チャット内容を取得できませんでした。スキップします。');
            return 0;
        }

        const result = await this.docUpdater.updateDocuments(chatContent);
        
        if (result.updated) {
            this.log('ドキュメントが更新されました。コミット前に確認してください。');
            return 0;
        } else {
            this.log('ドキュメントの更新は不要です。');
            return 0;
        }
    }

    async defaultRun() {
        this.log('対話モードで実行中...');
        
        // 簡単なテスト実行
        const testChatContent = this.generateTestChatContent();
        const result = await this.docUpdater.updateDocuments(testChatContent);
        
        console.log('テスト実行結果:', JSON.stringify(result, null, 2));
        return 0;
    }

    findChatLogFile() {
        const possiblePaths = [
            path.join(this.projectRoot, '.claude-chat-log.json'),
            path.join(this.projectRoot, 'chat.log'),
            path.join(process.env.HOME || '', '.claude-code', 'chat.log')
        ];

        for (const filepath of possiblePaths) {
            if (fs.existsSync(filepath)) {
                return filepath;
            }
        }

        return null;
    }

    readChatLog(filepath) {
        try {
            return fs.readFileSync(filepath, 'utf8');
        } catch (error) {
            this.log(`チャットログ読み込みエラー: ${error.message}`);
            return null;
        }
    }

    getChatContentFromEnvironment() {
        return process.env.CLAUDE_CHAT_CONTENT || null;
    }

    async getChatContentFromClaudeAPI() {
        // 実際の実装では、Claude CodeのAPIやログシステムにアクセス
        // 現在は簡単な実装として null を返す
        return null;
    }

    readLatestChatLog() {
        const logFile = this.findChatLogFile();
        return logFile ? this.readChatLog(logFile) : null;
    }

    generateTestChatContent() {
        return `Human: 新しいチャット機能を実装してください。