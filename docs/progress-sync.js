/**
 * Project Progress Synchronization System
 * JSONデータベースから開発計画書とダッシュボードを自動生成・同期
 */

class ProgressSyncSystem {
    constructor() {
        this.progressData = null;
        this.loadProgressData();
    }

    async loadProgressData() {
        try {
            const response = await fetch('project-progress.json');
            this.progressData = await response.json();
            console.log('✅ Progress data loaded:', this.progressData);
        } catch (error) {
            console.error('❌ Failed to load progress data:', error);
        }
    }

    // Phase進捗を計算
    calculatePhaseProgress(phaseId) {
        if (!this.progressData) return 0;
        
        const phaseFeatures = this.progressData.features.filter(f => f.phase === phaseId);
        if (phaseFeatures.length === 0) return 0;
        
        const totalProgress = phaseFeatures.reduce((sum, feature) => sum + feature.progress, 0);
        return Math.round(totalProgress / phaseFeatures.length);
    }

    // 全体進捗を計算
    calculateOverallProgress() {
        if (!this.progressData) return 0;
        
        const completedPhases = this.progressData.phases.filter(p => p.status === 'completed').length;
        const currentPhase = this.progressData.phases.find(p => p.status === 'in_progress');
        
        let progress = (completedPhases / this.progressData.phases.length) * 100;
        
        if (currentPhase) {
            const currentPhaseProgress = this.calculatePhaseProgress(currentPhase.id);
            progress += (currentPhaseProgress / 100) * (1 / this.progressData.phases.length) * 100;
        }
        
        return Math.round(progress);
    }

    // 現在のPhaseを取得
    getCurrentPhase() {
        if (!this.progressData) return null;
        
        return this.progressData.phases.find(p => p.status === 'in_progress') || 
               this.progressData.phases.find(p => p.status === 'completed');
    }

    // ダッシュボード用HTML生成
    generateDashboardHTML() {
        if (!this.progressData) return '';
        
        const currentPhase = this.getCurrentPhase();
        const overallProgress = this.calculateOverallProgress();
        const completedPhases = this.progressData.phases.filter(p => p.status === 'completed').length;
        
        return `
        <!-- 全体フェーズ概要 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">プロジェクト全体フェーズ概要</h2>
            <div class="grid md:grid-cols-4 gap-4 mb-6">
                ${this.progressData.phases.map(phase => this.generatePhaseCard(phase)).join('')}
            </div>
            
            <!-- 進捗サマリー -->
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-green-50 border-l-4 border-green-500 p-4">
                    <h3 class="font-semibold text-green-800 mb-2">現在のフェーズ進捗</h3>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-2xl font-bold text-green-600">${currentPhase?.name || 'Phase 0'}</span>
                        <span class="text-green-700 font-medium">${this.calculatePhaseProgress(currentPhase?.id || 'phase-0')}%</span>
                    </div>
                    <div class="w-full bg-green-200 rounded-full h-3">
                        <div class="bg-green-600 h-3 rounded-full progress-bar" style="width: ${this.calculatePhaseProgress(currentPhase?.id || 'phase-0')}%"></div>
                    </div>
                    <p class="text-sm text-green-700 mt-2">✅ ${currentPhase?.description || 'フェーズ情報なし'}</p>
                </div>
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <h3 class="font-semibold text-blue-800 mb-2">全体プロジェクト進捗</h3>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-2xl font-bold text-blue-600">${overallProgress}%</span>
                        <span class="text-blue-700 font-medium">${completedPhases}/${this.progressData.phases.length} 完了</span>
                    </div>
                    <div class="w-full bg-blue-200 rounded-full h-3">
                        <div class="bg-blue-600 h-3 rounded-full progress-bar" style="width: ${overallProgress}%"></div>
                    </div>
                    <p class="text-sm text-blue-700 mt-2">🎉 ${this.getOverallStatusMessage()}</p>
                </div>
            </div>
        </div>
        `;
    }

    // フェーズカード生成
    generatePhaseCard(phase) {
        const progress = this.calculatePhaseProgress(phase.id);
        const isCompleted = phase.status === 'completed';
        const isInProgress = phase.status === 'in_progress';
        
        let bgClass, textClass, borderClass;
        if (isCompleted) {
            bgClass = 'bg-green-500 text-white';
            textClass = 'text-white';
        } else if (isInProgress) {
            bgClass = 'bg-blue-500 text-white';
            textClass = 'text-white';
        } else {
            bgClass = 'bg-gray-100 border-2 border-dashed border-gray-300';
            textClass = 'text-gray-600';
        }
        
        return `
        <div class="relative">
            <div class="${bgClass} rounded-lg p-4 text-center">
                <h3 class="font-bold text-lg ${textClass}">${phase.name.split(':')[0]}</h3>
                <p class="text-sm ${textClass}">${phase.name.split(':')[1]?.trim() || phase.description}</p>
                <div class="mt-2">
                    <div class="w-full bg-${isCompleted || isInProgress ? 'white bg-opacity-30' : 'gray-200'} rounded-full h-2">
                        <div class="bg-${isCompleted || isInProgress ? 'white' : 'gray-400'} h-2 rounded-full" style="width: ${progress}%"></div>
                    </div>
                    <p class="text-xs mt-1 ${textClass}">${progress}%${isCompleted ? '完了' : isInProgress ? '進行中' : ''}</p>
                </div>
            </div>
            ${(isCompleted || isInProgress) ? `
            <div class="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                ●
            </div>` : ''}
        </div>
        `;
    }

    // 開発計画書用HTML生成
    generatePlanHTML() {
        if (!this.progressData) return '';
        
        return `
        <!-- ヘッダー -->
        <header class="mb-8 fade-in-up">
            <h1 class="text-4xl font-bold text-gray-800 mb-2">開発計画書</h1>
            <p class="text-xl text-gray-600 mb-4">フロントオフィス生産性向上アプリケーション</p>
            <div class="flex items-center space-x-4">
                <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium phase-badge">${this.getCurrentPhase()?.name || 'Phase 0'}完了</span>
                <span class="text-gray-500 text-sm">バージョン: ${this.progressData.project.version}</span>
                <span class="text-gray-500 text-sm">最終更新: ${this.progressData.project.lastUpdated}</span>
            </div>
        </header>

        ${this.generatePhaseDetails()}
        `;
    }

    // フェーズ詳細生成
    generatePhaseDetails() {
        return this.progressData.phases.map((phase, index) => {
            const phaseFeatures = this.progressData.features.filter(f => f.phase === phase.id);
            const progress = this.calculatePhaseProgress(phase.id);
            
            return `
            <section class="mb-8">
                <div class="section-card bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <span class="bg-${phase.status === 'completed' ? 'green' : phase.status === 'in_progress' ? 'blue' : 'gray'}-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">${index + 1}</span>
                        ${phase.name}${phase.status === 'completed' ? '（完了）' : phase.status === 'in_progress' ? '（進行中）' : '（予定）'}
                    </h2>
                    
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-lg font-medium">進捗: ${progress}%</span>
                            <span class="text-sm text-gray-500">${phase.budget}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="bg-${phase.status === 'completed' ? 'green' : phase.status === 'in_progress' ? 'blue' : 'gray'}-500 h-3 rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="grid gap-3">
                        ${phaseFeatures.map(feature => this.generateFeatureCard(feature)).join('')}
                    </div>
                </div>
            </section>
            `;
        }).join('');
    }

    // 機能カード生成
    generateFeatureCard(feature) {
        const statusColors = {
            'completed': 'green',
            'in_progress': 'blue', 
            'pending': 'gray'
        };
        
        const statusLabels = {
            'completed': '完了',
            'in_progress': '進行中',
            'pending': '未実装'
        };
        
        const color = statusColors[feature.status] || 'gray';
        
        return `
        <div class="feature-item p-4 border rounded-lg bg-${color}-50">
            <div class="flex items-start">
                <span class="bg-${color}-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-1">
                    ${feature.status === 'completed' ? '✓' : feature.status === 'in_progress' ? '!' : '○'}
                </span>
                <div class="flex-1">
                    <h4 class="font-semibold text-${color}-800">${feature.name}</h4>
                    <p class="text-${color}-600 text-sm mt-1">${statusLabels[feature.status]}: ${feature.description}</p>
                    <div class="mt-2">
                        <div class="w-full bg-${color}-200 rounded-full h-2">
                            <div class="bg-${color}-500 h-2 rounded-full" style="width: ${feature.progress}%"></div>
                        </div>
                        <span class="text-xs text-${color}-600 mt-1">${feature.progress}%</span>
                    </div>
                    ${feature.subFeatures ? `
                    <div class="mt-3 ml-4 space-y-1">
                        ${feature.subFeatures.map(sub => `
                        <div class="text-xs text-${color}-600 flex items-center">
                            <span class="mr-2">${sub.status === 'completed' ? '✅' : '⚠️'}</span>
                            ${sub.name}
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    }

    // 次のステップ生成
    generateNextSteps() {
        return `
        <div class="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h3 class="font-semibold text-blue-800 mb-2">🚀 次のステップ</h3>
            <div class="text-sm text-blue-700 space-y-1">
                ${this.progressData.nextSteps.map(step => `
                <p>🎯 <strong>${step.title}:</strong> ${step.description}</p>
                `).join('')}
            </div>
        </div>
        `;
    }

    // 全体ステータスメッセージ
    getOverallStatusMessage() {
        const currentPhase = this.getCurrentPhase();
        if (!currentPhase) return '初期化中';
        
        const progress = this.calculatePhaseProgress(currentPhase.id);
        if (currentPhase.status === 'completed') {
            return `${currentPhase.name.split(':')[0]}完了 | 次フェーズ選択可能`;
        } else {
            return `${currentPhase.name.split(':')[0]}進行中 (${progress}%) | 実装継続中`;
        }
    }

    // データ更新
    async updateProgress(updates) {
        // 実際の実装では、この関数でJSONファイルを更新し、
        // すべての関連ページを自動再生成する
        console.log('Progress update:', updates);
        
        // JSONデータを更新
        Object.assign(this.progressData, updates);
        
        // 関連ページを再生成
        this.syncAllPages();
    }

    // 全ページ同期
    syncAllPages() {
        // ダッシュボード更新
        const dashboardContainer = document.getElementById('dashboard-content');
        if (dashboardContainer) {
            dashboardContainer.innerHTML = this.generateDashboardHTML();
        }
        
        // 開発計画書更新
        const planContainer = document.getElementById('plan-content'); 
        if (planContainer) {
            planContainer.innerHTML = this.generatePlanHTML();
        }
        
        console.log('✅ All pages synchronized with progress data');
    }
}

// グローバルインスタンス
window.progressSync = new ProgressSyncSystem();

// ページ読み込み完了時に同期
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.progressSync) {
            window.progressSync.syncAllPages();
        }
    }, 100);
});