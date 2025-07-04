#!/usr/bin/env node

/**
 * Claude Code ドキュメント自動更新スケジューラー
 * 指定した間隔でチャット内容を解析してドキュメントを更新
 */

const DocumentUpdater = require('./doc-updater');
const path = require('path');

class AutomationScheduler {
    constructor(options = {}) {
        this.projectRoot = path.dirname(process.cwd());
        this.docUpdater = new DocumentUpdater({ projectRoot: this.projectRoot });
        this.interval = options.interval || 2 * 60 * 60 * 1000; // デフォルト2時間
        this.isRunning = false;
        this.timer = null;
    }

    /**
     * スケジューラー開始
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  スケジューラーは既に実行中です');
            return;
        }

        this.isRunning = true;
        console.log(`🚀 Claude Code 自動更新スケジューラー開始`);
        console.log(`⏰ 実行間隔: ${this.interval / 1000 / 60}分`);
        console.log(`📅 開始時刻: ${new Date().toLocaleString()}`);
        console.log(`🔄 次回実行予定: ${new Date(Date.now() + this.interval).toLocaleString()}`);
        
        // 即座に1回実行
        this.runUpdate();
        
        // 定期実行を開始
        this.timer = setInterval(() => {
            this.runUpdate();
        }, this.interval);

        // プロセス終了時のクリーンアップ
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    /**
     * スケジューラー停止
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('\n🛑 スケジューラーを停止中...');
        this.isRunning = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        console.log('✅ スケジューラーが停止しました');
        process.exit(0);
    }

    /**
     * 更新実行
     */
    async runUpdate() {
        const timestamp = new Date().toLocaleString();
        console.log(`\n🔄 [${timestamp}] 自動更新を実行中...`);
        
        try {
            // 現在のチャット内容を生成（実際の実装では環境変数やAPIから取得）
            const chatContent = this.generateCurrentChatContent();
            
            if (!chatContent) {
                console.log('📝 新しいチャット内容がありません');
                this.scheduleNext();
                return;
            }

            const result = await this.docUpdater.updateDocuments(chatContent);
            
            if (result.updated) {
                console.log('🎉 ドキュメント更新完了！');
                console.log(`📊 検出変更: ${Object.entries(result.analysis).filter(([key, items]) => 
                    key !== 'timestamp' && Array.isArray(items) && items.length > 0
                ).length}カテゴリ`);
                console.log(`📁 更新ファイル: ${Object.values(result.updates).flat().length}件`);
            } else {
                console.log('📝 更新対象なし（変更検出されませんでした）');
            }
            
        } catch (error) {
            console.error('❌ 自動更新エラー:', error.message);
        }
        
        this.scheduleNext();
    }

    /**
     * 次回実行予定を表示
     */
    scheduleNext() {
        if (this.isRunning) {
            const nextRun = new Date(Date.now() + this.interval);
            console.log(`⏰ 次回実行予定: ${nextRun.toLocaleString()}`);
        }
    }

    /**
     * 現在のチャット内容を生成
     */
    generateCurrentChatContent() {
        // 環境変数から取得を試行
        if (process.env.CLAUDE_CHAT_CONTENT) {
            return process.env.CLAUDE_CHAT_CONTENT;
        }

        // 簡単なシミュレーション（実際の用途では外部APIまたはログファイルから取得）
        const now = new Date();
        const sessionId = Math.random().toString(36).substring(7);
        
        return `Human: 定期チェック - ${now.toLocaleString()}
Assistant: 定期チェック完了。システムは正常に動作しています。`;
    }
}

// メイン実行
if (require.main === module) {
    const scheduler = new AutomationScheduler({
        interval: 2 * 60 * 60 * 1000 // 2時間間隔
    });
    
    scheduler.start();
}