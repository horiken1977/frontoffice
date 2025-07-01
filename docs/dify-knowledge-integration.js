// Dify Knowledge Base 統合スクリプト
// 社内データ検索機能用

class DifyKnowledgeSearch {
    constructor(config) {
        this.config = config;
        this.apiEndpoint = 'https://api.dify.ai/v1/chat-messages';
        this.knowledgeEndpoint = 'https://api.dify.ai/v1/knowledge-bases';
    }

    // Knowledge Base検索
    async searchKnowledge(query, knowledgeBaseId = null) {
        try {
            console.log('🔍 Knowledge Base検索開始:', query);
            
            // Knowledge Base IDが指定されている場合は、専用検索を使用
            if (knowledgeBaseId) {
                return await this.searchWithKnowledgeBase(query, knowledgeBaseId);
            }
            
            // 通常のチャット検索（Knowledge Baseが統合されている場合）
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: {},
                    query: `以下の質問について、社内データベースから関連情報を検索して回答してください：${query}`,
                    response_mode: 'blocking',
                    conversation_id: null, // 新しい検索セッション
                    user: 'knowledge-search'
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ 検索成功:', data);
            
            return {
                success: true,
                answer: data.answer,
                conversationId: data.conversation_id,
                messageId: data.message_id,
                usage: data.metadata?.usage || null
            };
        } catch (error) {
            console.error('❌ Knowledge Base検索エラー:', error);
            return {
                success: false,
                error: error.message,
                answer: 'データ検索中にエラーが発生しました。しばらくしてから再度お試しください。'
            };
        }
    }

    // Knowledge Base専用検索（将来の拡張用）
    async searchWithKnowledgeBase(query, knowledgeBaseId) {
        try {
            const response = await fetch(`${this.knowledgeEndpoint}/${knowledgeBaseId}/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    top_k: 5, // 上位5件の関連文書を取得
                    score_threshold: 0.5 // 関連度のしきい値
                })
            });

            if (!response.ok) {
                throw new Error(`Knowledge Base API Error: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                results: data.documents || [],
                answer: this.formatKnowledgeResults(data.documents),
                usage: data.usage || null
            };
        } catch (error) {
            console.error('❌ Knowledge Base専用検索エラー:', error);
            return {
                success: false,
                error: error.message,
                answer: '専用検索機能でエラーが発生しました。通常検索をお試しください。'
            };
        }
    }

    // Knowledge Base検索結果のフォーマット
    formatKnowledgeResults(documents) {
        if (!documents || documents.length === 0) {
            return '関連する情報が見つかりませんでした。検索キーワードを変更してお試しください。';
        }

        let formattedResult = '📊 社内データ検索結果:\n\n';
        
        documents.forEach((doc, index) => {
            formattedResult += `**${index + 1}. ${doc.title || '関連情報'}**\n`;
            formattedResult += `${doc.content}\n`;
            if (doc.score) {
                formattedResult += `*関連度: ${Math.round(doc.score * 100)}%*\n`;
            }
            formattedResult += '\n---\n\n';
        });

        return formattedResult;
    }

    // 検索クエリの最適化
    optimizeQuery(originalQuery) {
        // 営業用語の拡張
        const salesTerms = {
            '顧客': ['顧客', 'クライアント', '客先', '取引先'],
            '提案': ['提案', 'プロポーザル', '企画', 'ソリューション'],
            '競合': ['競合', '競合他社', 'ライバル', '他社'],
            '価格': ['価格', '料金', 'コスト', '費用', '予算'],
            '機能': ['機能', 'フィーチャー', '仕様', 'スペック']
        };

        let optimizedQuery = originalQuery;
        
        // 同義語の追加
        Object.keys(salesTerms).forEach(key => {
            if (originalQuery.includes(key)) {
                const synonyms = salesTerms[key].join('、');
                optimizedQuery += ` （関連キーワード: ${synonyms}）`;
            }
        });

        return optimizedQuery;
    }

    // 検索履歴の保存
    saveSearchHistory(query, results) {
        const history = JSON.parse(localStorage.getItem('knowledgeSearchHistory') || '[]');
        
        history.unshift({
            timestamp: new Date().toISOString(),
            query: query,
            resultCount: results.results?.length || 0,
            success: results.success
        });

        // 最新50件のみ保持
        if (history.length > 50) {
            history.splice(50);
        }

        localStorage.setItem('knowledgeSearchHistory', JSON.stringify(history));
    }

    // 検索履歴の取得
    getSearchHistory() {
        return JSON.parse(localStorage.getItem('knowledgeSearchHistory') || '[]');
    }

    // 人気検索キーワードの取得
    getPopularKeywords() {
        const history = this.getSearchHistory();
        const keywords = {};
        
        history.forEach(item => {
            if (item.success) {
                const words = item.query.split(/\s+/);
                words.forEach(word => {
                    if (word.length > 1) {
                        keywords[word] = (keywords[word] || 0) + 1;
                    }
                });
            }
        });

        // 使用頻度順にソート
        return Object.entries(keywords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([keyword]) => keyword);
    }
}

// 検索UI管理クラス
class KnowledgeSearchUI {
    constructor(difyKnowledgeSearch) {
        this.knowledgeSearch = difyKnowledgeSearch;
        this.currentSearch = null;
        this.initializeElements();
    }

    initializeElements() {
        this.searchButton = document.getElementById('knowledgeSearchButton');
        this.searchInput = document.getElementById('knowledgeSearchInput');
        this.resultsContainer = document.getElementById('knowledgeSearchResults');
        this.loadingIndicator = document.getElementById('searchLoading');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => this.performSearch());
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // クイック検索ボタン
        document.querySelectorAll('.knowledge-quick-search').forEach(button => {
            button.addEventListener('click', () => {
                const query = button.getAttribute('data-query');
                this.searchInput.value = query;
                this.performSearch();
            });
        });
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert('検索キーワードを入力してください');
            return;
        }

        this.showLoading();
        
        try {
            const optimizedQuery = this.knowledgeSearch.optimizeQuery(query);
            const results = await this.knowledgeSearch.searchKnowledge(optimizedQuery);
            
            this.displayResults(results, query);
            this.knowledgeSearch.saveSearchHistory(query, results);
            
        } catch (error) {
            console.error('検索エラー:', error);
            this.displayError('検索中にエラーが発生しました');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'block';
        }
        if (this.searchButton) {
            this.searchButton.disabled = true;
            this.searchButton.textContent = '検索中...';
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
        if (this.searchButton) {
            this.searchButton.disabled = false;
            this.searchButton.textContent = '検索';
        }
    }

    displayResults(results, originalQuery) {
        if (!this.resultsContainer) return;

        const timestamp = new Date().toLocaleString('ja-JP');
        
        if (results.success) {
            this.resultsContainer.innerHTML = `
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-gray-800">🔍 検索結果: "${originalQuery}"</h3>
                        <span class="text-xs text-gray-500">${timestamp}</span>
                    </div>
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div class="prose prose-sm max-w-none">
                            ${this.formatResultContent(results.answer)}
                        </div>
                    </div>
                    ${results.usage ? this.formatUsageInfo(results.usage) : ''}
                </div>
            `;
        } else {
            this.resultsContainer.innerHTML = `
                <div class="space-y-4">
                    <h3 class="font-semibold text-gray-800">🔍 検索結果: "${originalQuery}"</h3>
                    <div class="bg-red-50 border-l-4 border-red-400 p-4">
                        <p class="text-red-700">${results.answer}</p>
                        <p class="text-xs text-red-600 mt-2">エラー詳細: ${results.error}</p>
                    </div>
                </div>
            `;
        }
    }

    displayError(message) {
        if (!this.resultsContainer) return;
        
        this.resultsContainer.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-400 p-4">
                <p class="text-red-700">${message}</p>
            </div>
        `;
    }

    formatResultContent(content) {
        return content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/---/g, '<hr class="my-2">');
    }

    formatUsageInfo(usage) {
        return `
            <div class="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600">
                <span class="font-medium">API使用量:</span>
                トークン数: ${usage.total_tokens || 'N/A'} |
                検索時間: ${usage.response_time || 'N/A'}ms
            </div>
        `;
    }
}

// グローバル初期化
let knowledgeSearchSystem = null;

function initializeKnowledgeSearch(apiKey) {
    if (!apiKey) {
        console.error('❌ API Key が設定されていません');
        return;
    }

    const config = { apiKey: apiKey };
    const knowledgeSearch = new DifyKnowledgeSearch(config);
    const searchUI = new KnowledgeSearchUI(knowledgeSearch);
    
    knowledgeSearchSystem = {
        search: knowledgeSearch,
        ui: searchUI
    };
    
    console.log('✅ Knowledge Search System 初期化完了');
    return knowledgeSearchSystem;
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DifyKnowledgeSearch,
        KnowledgeSearchUI,
        initializeKnowledgeSearch
    };
}