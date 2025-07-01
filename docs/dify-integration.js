// Dify API統合スクリプト
// このファイルはDify APIと既存のチャット画面を統合します

// Dify API設定
const DIFY_CONFIG = {
    apiEndpoint: 'https://api.dify.ai/v1/chat-messages',
    apiKey: 'app-fOpZcklIbAygUiotfGdH58zY',
    conversationId: null // 会話IDは動的に管理
};

// Difyクライアントクラス
class DifyClient {
    constructor(config) {
        this.config = config;
        this.conversationId = null;
    }

    // メッセージ送信
    async sendMessage(message, user = 'default-user') {
        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: {},
                    query: message,
                    response_mode: 'blocking',
                    conversation_id: this.conversationId,
                    user: user
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            // 会話IDを保存
            if (data.conversation_id) {
                this.conversationId = data.conversation_id;
            }

            return {
                answer: data.answer,
                conversationId: data.conversation_id,
                messageId: data.message_id
            };
        } catch (error) {
            console.error('Dify API Error:', error);
            return {
                answer: 'エラーが発生しました。しばらくしてから再度お試しください。',
                error: true
            };
        }
    }

    // 会話履歴の取得
    async getConversationHistory() {
        if (!this.conversationId) return [];

        try {
            const response = await fetch(`${this.config.apiEndpoint}/conversations/${this.conversationId}/messages`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Failed to fetch conversation history:', error);
            return [];
        }
    }

    // 新しい会話を開始
    resetConversation() {
        this.conversationId = null;
    }
}

// チャットUIマネージャー
class ChatUIManager {
    constructor(difyClient) {
        this.difyClient = difyClient;
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.charCount = document.getElementById('charCount');
        this.quickActions = document.querySelectorAll('.quick-action');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 文字数カウント
        this.messageInput.addEventListener('input', () => {
            const length = this.messageInput.value.length;
            this.charCount.textContent = length;
            this.sendButton.disabled = length === 0;
        });

        // Enter + Shift で改行、Enter のみで送信
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!this.sendButton.disabled) {
                    this.sendMessage();
                }
            }
        });

        // 送信ボタン
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // クイックアクション
        this.quickActions.forEach(button => {
            button.addEventListener('click', () => {
                const message = button.getAttribute('data-message');
                this.messageInput.value = message;
                this.messageInput.dispatchEvent(new Event('input'));
                this.messageInput.focus();
            });
        });

        // 初期フォーカス
        this.messageInput.focus();
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // ユーザーメッセージを表示
        this.addMessage('user', message);

        // 入力をクリア
        this.messageInput.value = '';
        this.messageInput.dispatchEvent(new Event('input'));

        // 送信ボタンを無効化（ローディング中）
        this.sendButton.disabled = true;
        this.sendButton.textContent = '送信中...';

        // タイピングインジケーターを表示
        const typingIndicator = this.addTypingIndicator();

        try {
            // Dify APIにメッセージを送信
            const response = await this.difyClient.sendMessage(message);

            // タイピングインジケーターを削除
            typingIndicator.remove();

            // AI応答を表示
            this.addMessage('ai', response.answer);

        } catch (error) {
            console.error('Failed to send message:', error);
            typingIndicator.remove();
            this.addMessage('ai', 'エラーが発生しました。もう一度お試しください。');
        } finally {
            // 送信ボタンを再度有効化
            this.sendButton.disabled = false;
            this.sendButton.textContent = '送信';
        }
    }

    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message flex items-start space-x-3 fade-in-up';
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    You
                </div>
                <div class="bg-gray-100 rounded-lg px-4 py-3 max-w-md">
                    <p class="text-gray-800 whitespace-pre-wrap">${this.escapeHtml(text)}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    AI
                </div>
                <div class="bg-blue-50 rounded-lg px-4 py-3 max-w-md">
                    <div class="text-gray-800 whitespace-pre-wrap">${this.formatAIResponse(text)}</div>
                </div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message flex items-start space-x-3 typing-indicator';
        typingDiv.innerHTML = `
            <div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                AI
            </div>
            <div class="bg-blue-50 rounded-lg px-4 py-3">
                <div class="flex space-x-2">
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return typingDiv;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatAIResponse(text) {
        // 基本的なマークダウン形式をHTMLに変換
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ');
    }
}

// 初期化関数
function initializeDifyChat() {
    // API設定が完了しているか確認
    if (DIFY_CONFIG.apiEndpoint === 'YOUR_DIFY_API_ENDPOINT') {
        console.error('Dify API設定が完了していません。dify-integration.jsのDIFY_CONFIGを更新してください。');
        return;
    }

    // Difyクライアントとチャットマネージャーを初期化
    const difyClient = new DifyClient(DIFY_CONFIG);
    const chatUI = new ChatUIManager(difyClient);

    // グローバルに公開（デバッグ用）
    window.difyChat = {
        client: difyClient,
        ui: chatUI
    };

    console.log('Dify Chat initialized successfully!');
}

// DOMが読み込まれたら初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDifyChat);
} else {
    initializeDifyChat();
}