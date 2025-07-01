// フロントオフィス フィードバック収集システム
// 各ページで共通利用できるフィードバック機能

class FeedbackSystem {
    constructor() {
        this.storageKey = 'frontoffice_feedback';
        this.searchHistoryKey = 'search_history';
        this.initializeStorage();
    }

    // ストレージの初期化
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                ratings: [],
                improvements: [],
                searchQueries: []
            }));
        }
    }

    // 検索クエリの記録
    recordSearchQuery(query, page = 'data-search') {
        const data = this.getFeedbackData();
        const searchRecord = {
            id: this.generateId(),
            query: query,
            timestamp: new Date().toISOString(),
            page: page,
            userAgent: navigator.userAgent
        };
        
        data.searchQueries.push(searchRecord);
        this.saveFeedbackData(data);
        
        // 検索履歴も別途保存（高速アクセス用）
        this.updateSearchHistory(query);
    }

    // 検索結果の評価
    rateSearchResult(query, rating, resultContent = '') {
        const data = this.getFeedbackData();
        const ratingRecord = {
            id: this.generateId(),
            query: query,
            rating: rating, // 'helpful' or 'not-helpful'
            resultContent: resultContent.substring(0, 500), // 最初の500文字のみ保存
            timestamp: new Date().toISOString(),
            page: 'data-search'
        };
        
        data.ratings.push(ratingRecord);
        this.saveFeedbackData(data);
        
        return ratingRecord;
    }

    // 改善要望の送信
    submitImprovement(category, message, page = 'general') {
        const data = this.getFeedbackData();
        const improvementRecord = {
            id: this.generateId(),
            category: category, // 'search', 'ui', 'feature', 'bug', 'other'
            message: message,
            timestamp: new Date().toISOString(),
            page: page,
            userAgent: navigator.userAgent
        };
        
        data.improvements.push(improvementRecord);
        this.saveFeedbackData(data);
        
        return improvementRecord;
    }

    // 人気の検索クエリを取得
    getPopularQueries(limit = 10) {
        const data = this.getFeedbackData();
        const queryCount = {};
        
        // クエリの出現回数をカウント
        data.searchQueries.forEach(record => {
            const normalizedQuery = record.query.toLowerCase().trim();
            queryCount[normalizedQuery] = (queryCount[normalizedQuery] || 0) + 1;
        });
        
        // 出現回数でソートして上位を返す
        return Object.entries(queryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([query, count]) => ({ query, count }));
    }

    // 検索履歴の更新（最近の検索用）
    updateSearchHistory(query) {
        let history = JSON.parse(localStorage.getItem(this.searchHistoryKey) || '[]');
        
        // 重複を削除
        history = history.filter(q => q !== query);
        
        // 新しいクエリを先頭に追加
        history.unshift(query);
        
        // 最大20件まで保持
        if (history.length > 20) {
            history = history.slice(0, 20);
        }
        
        localStorage.setItem(this.searchHistoryKey, JSON.stringify(history));
    }

    // 最近の検索履歴を取得
    getRecentSearches(limit = 5) {
        const history = JSON.parse(localStorage.getItem(this.searchHistoryKey) || '[]');
        return history.slice(0, limit);
    }

    // フィードバックデータの取得
    getFeedbackData() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    // フィードバックデータの保存
    saveFeedbackData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // フィードバックサマリーの生成
    generateSummary() {
        const data = this.getFeedbackData();
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        
        // 評価の集計
        const ratings = data.ratings || [];
        const recentRatings = ratings.filter(r => new Date(r.timestamp) > oneDayAgo);
        const helpfulCount = recentRatings.filter(r => r.rating === 'helpful').length;
        const notHelpfulCount = recentRatings.filter(r => r.rating === 'not-helpful').length;
        
        // 検索クエリの集計
        const queries = data.searchQueries || [];
        const recentQueries = queries.filter(q => new Date(q.timestamp) > oneWeekAgo);
        
        return {
            totalFeedback: ratings.length,
            recentFeedback: {
                helpful: helpfulCount,
                notHelpful: notHelpfulCount,
                total: recentRatings.length
            },
            totalSearches: queries.length,
            recentSearches: recentQueries.length,
            popularQueries: this.getPopularQueries(5),
            improvements: (data.improvements || []).slice(-10) // 最新10件
        };
    }

    // CSV形式でのエクスポート
    exportToCSV() {
        const data = this.getFeedbackData();
        const BOM = '\uFEFF';
        let csv = BOM;
        
        // 検索クエリのCSV
        csv += '=== 検索クエリ履歴 ===\n';
        csv += 'タイムスタンプ,クエリ,ページ\n';
        data.searchQueries.forEach(q => {
            csv += `"${q.timestamp}","${q.query}","${q.page}"\n`;
        });
        
        csv += '\n=== 評価履歴 ===\n';
        csv += 'タイムスタンプ,クエリ,評価,ページ\n';
        data.ratings.forEach(r => {
            csv += `"${r.timestamp}","${r.query}","${r.rating}","${r.page}"\n`;
        });
        
        csv += '\n=== 改善要望 ===\n';
        csv += 'タイムスタンプ,カテゴリ,メッセージ,ページ\n';
        data.improvements.forEach(i => {
            csv += `"${i.timestamp}","${i.category}","${i.message}","${i.page}"\n`;
        });
        
        return csv;
    }

    // IDの生成
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // フィードバックUIの生成
    createFeedbackUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="feedback-widget bg-white rounded-lg shadow-md p-4 mt-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-3">📝 フィードバック</h3>
                
                <!-- 評価ボタン -->
                <div class="rating-section mb-4">
                    <p class="text-sm text-gray-600 mb-2">この検索結果は役に立ちましたか？</p>
                    <div class="flex space-x-2">
                        <button class="feedback-helpful bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg transition-colors flex items-center">
                            <span class="mr-2">👍</span> 役立った
                        </button>
                        <button class="feedback-not-helpful bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors flex items-center">
                            <span class="mr-2">👎</span> 役立たなかった
                        </button>
                    </div>
                </div>
                
                <!-- 改善要望 -->
                <div class="improvement-section">
                    <button class="toggle-improvement text-blue-600 hover:text-blue-800 text-sm underline">
                        改善要望を送信する
                    </button>
                    <div class="improvement-form hidden mt-3">
                        <select class="improvement-category w-full px-3 py-2 border rounded-lg mb-2">
                            <option value="">カテゴリを選択...</option>
                            <option value="search">検索機能</option>
                            <option value="ui">画面・操作性</option>
                            <option value="feature">新機能要望</option>
                            <option value="bug">不具合報告</option>
                            <option value="other">その他</option>
                        </select>
                        <textarea class="improvement-message w-full px-3 py-2 border rounded-lg mb-2" rows="3" placeholder="具体的な内容をお聞かせください..."></textarea>
                        <button class="submit-improvement bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            送信
                        </button>
                    </div>
                </div>
                
                <!-- フィードバック完了メッセージ -->
                <div class="feedback-message hidden mt-3 p-3 rounded-lg"></div>
            </div>
        `;
        
        this.attachEventListeners(container);
    }

    // イベントリスナーの設定
    attachEventListeners(container) {
        const widget = container.querySelector('.feedback-widget');
        
        // 評価ボタン
        widget.querySelector('.feedback-helpful').addEventListener('click', () => {
            this.handleRating('helpful');
        });
        
        widget.querySelector('.feedback-not-helpful').addEventListener('click', () => {
            this.handleRating('not-helpful');
        });
        
        // 改善要望フォームの表示切替
        widget.querySelector('.toggle-improvement').addEventListener('click', (e) => {
            e.preventDefault();
            const form = widget.querySelector('.improvement-form');
            form.classList.toggle('hidden');
        });
        
        // 改善要望の送信
        widget.querySelector('.submit-improvement').addEventListener('click', () => {
            const category = widget.querySelector('.improvement-category').value;
            const message = widget.querySelector('.improvement-message').value;
            
            if (category && message) {
                this.submitImprovement(category, message, window.location.pathname);
                this.showFeedbackMessage('改善要望を送信しました。ありがとうございます！', 'success');
                
                // フォームをリセット
                widget.querySelector('.improvement-category').value = '';
                widget.querySelector('.improvement-message').value = '';
                widget.querySelector('.improvement-form').classList.add('hidden');
            } else {
                this.showFeedbackMessage('カテゴリとメッセージを入力してください。', 'error');
            }
        });
    }

    // 評価の処理
    handleRating(rating) {
        // 最後の検索クエリを取得
        const lastQuery = this.getRecentSearches(1)[0] || '不明なクエリ';
        this.rateSearchResult(lastQuery, rating);
        this.showFeedbackMessage('評価を送信しました。ありがとうございます！', 'success');
    }

    // フィードバックメッセージの表示
    showFeedbackMessage(message, type = 'success') {
        const messageDiv = document.querySelector('.feedback-message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `feedback-message mt-3 p-3 rounded-lg ${
                type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`;
            messageDiv.classList.remove('hidden');
            
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 3000);
        }
    }
}

// グローバルインスタンスの作成
const feedbackSystem = new FeedbackSystem();

// エクスポート（必要に応じて）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackSystem;
}