/**
 * Claude Code チャット内容キャプチャシステム
 * 現在のチャット会話を取得・保存する
 */

const fs = require('fs');
const path = require('path');

class ChatCapture {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.chatLogPath = path.join(this.projectRoot, '.claude-chat-current.json');
        this.sessionStart = new Date().toISOString();
    }

    /**
     * チャット内容を手動で追加（デモ用）
     */
    addChatEntry(userMessage, assistantMessage) {
        const entry = {
            timestamp: new Date().toISOString(),
            user: userMessage,
            assistant: assistantMessage
        };

        const chatLog = this.loadChatLog();
        chatLog.entries.push(entry);
        chatLog.lastUpdated = entry.timestamp;

        this.saveChatLog(chatLog);
        return entry;
    }

    /**
     * 現在のセッションのチャット内容を取得
     */
    getCurrentSessionChat() {
        const chatLog = this.loadChatLog();
        
        // テスト用のチャット内容を生成（実際の実装では環境変数や API から取得）
        if (chatLog.entries.length === 0) {
            return this.generateCurrentSessionChat();
        }

        return this.formatChatContent(chatLog.entries);
    }

    /**
     * チャットログの読み込み
     */
    loadChatLog() {
        if (fs.existsSync(this.chatLogPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.chatLogPath, 'utf8'));
            } catch (error) {
                console.warn('チャットログの読み込みに失敗:', error.message);
            }
        }

        return {
            sessionStart: this.sessionStart,
            entries: [],
            lastUpdated: null
        };
    }

    /**
     * チャットログの保存
     */
    saveChatLog(chatLog) {
        try {
            fs.writeFileSync(this.chatLogPath, JSON.stringify(chatLog, null, 2));
        } catch (error) {
            console.error('チャットログの保存に失敗:', error.message);
        }
    }

    /**
     * チャット内容のフォーマット
     */
    formatChatContent(entries) {
        return entries.map(entry => 
            `Human: ${entry.user}\n\nAssistant: ${entry.assistant}\n`
        ).join('\n');
    }

    /**
     * 現在のセッションの推定チャット内容を生成
     */
    generateCurrentSessionChat() {
        const now = new Date();
        const sessionTime = now.toISOString();

        // 実際のチャット内容をシミュレート
        const chatContent = `Human: ドキュメントの自動更新システムが稼働しているか確認をお願いします。