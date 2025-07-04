#!/usr/bin/env node

/**
 * Claude Code ドキュメント自動更新システム テストスイート
 */

const fs = require('fs');
const path = require('path');
const ChatAnalyzer = require('./chat-analyzer');
const DocumentUpdater = require('./doc-updater');

class AutomationTester {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.testResults = [];
        this.testData = this.generateTestData();
    }

    async runAllTests() {
        console.log('Claude Code ドキュメント自動更新システム テスト開始...\n');

        try {
            await this.testChatAnalyzer();
            await this.testDocumentUpdater();
            await this.testIntegration();
            await this.testConfigValidation();

            this.printResults();
            return this.testResults.every(test => test.passed);
        } catch (error) {
            console.error('テスト実行エラー:', error);
            return false;
        }
    }

    async testChatAnalyzer() {
        console.log('=== チャット解析システムテスト ===');

        const analyzer = new ChatAnalyzer({ projectRoot: this.projectRoot });

        // テスト1: 機能追加の検出
        await this.runTest('機能追加検出', async () => {
            const analysis = await analyzer.analyzeChatContent(this.testData.featureAddition);
            return analysis.features.length > 0 && 
                   analysis.features[0].description.includes('新しいチャット機能');
        });

        // テスト2: テスト実行の検出  
        await this.runTest('テスト実行検出', async () => {
            const analysis = await analyzer.analyzeChatContent(this.testData.testing);
            return analysis.tests.length > 0;
        });

        // テスト3: バグ修正の検出
        await this.runTest('バグ修正検出', async () => {
            const analysis = await analyzer.analyzeChatContent(this.testData.bugFix);
            return analysis.bugs.length > 0;
        });

        // テスト4: ファイル参照の抽出
        await this.runTest('ファイル参照抽出', async () => {
            const analysis = await analyzer.analyzeChatContent(this.testData.withFiles);
            return analysis.features.length > 0 && 
                   analysis.features[0].files.includes('docs/chat.html');
        });

        // テスト5: 重複排除
        await this.runTest('変更検出（ハッシュ）', () => {
            const content = 'テストコンテンツ';
            const hasChanges1 = analyzer.hasNewChanges(content);
            const hasChanges2 = analyzer.hasNewChanges(content); // 同じ内容
            return hasChanges1 === true && hasChanges2 === false;
        });
    }

    async testDocumentUpdater() {
        console.log('\n=== ドキュメント更新システムテスト ===');

        const updater = new DocumentUpdater({ projectRoot: this.projectRoot });

        // テスト1: ドキュメント作成
        await this.runTest('ドキュメント作成', async () => {
            const testDocPath = path.join(this.projectRoot, 'docs', 'test-doc.md');
            
            // テストファイルのクリーンアップ
            if (fs.existsSync(testDocPath)) {
                fs.unlinkSync(testDocPath);
            }

            await updater.createDocument(testDocPath, 'test-doc.md');
            const exists = fs.existsSync(testDocPath);
            
            // クリーンアップ
            if (exists) {
                fs.unlinkSync(testDocPath);
            }
            
            return exists;
        });

        // テスト2: ドキュメント更新
        await this.runTest('ドキュメント更新', async () => {
            const testItems = [{
                description: 'テスト機能追加',
                files: ['test.js'],
                timestamp: new Date().toISOString()
            }];

            const originalContent = '# テストドキュメント\n\n## 最新の変更履歴\n\n';
            const updatedContent = updater.updateDevelopmentLog(originalContent, 'features', testItems);
            
            return updatedContent.includes('テスト機能追加') && 
                   updatedContent.includes('test.js');
        });

        // テスト3: カテゴリラベル
        await this.runTest('カテゴリラベル変換', () => {
            return updater.getCategoryLabel('features') === '機能追加' &&
                   updater.getCategoryLabel('tests') === 'テスト' &&
                   updater.getCategoryLabel('bugs') === 'バグ修正';
        });
    }

    async testIntegration() {
        console.log('\n=== 統合テスト ===');

        const updater = new DocumentUpdater({ projectRoot: this.projectRoot });

        // テスト1: 完全なワークフロー
        await this.runTest('完全なワークフロー', async () => {
            try {
                const result = await updater.updateDocuments(this.testData.comprehensive);
                return result.updated !== undefined && result.analysis !== undefined;
            } catch (error) {
                console.error('統合テストエラー:', error);
                return false;
            }
        });
    }

    async testConfigValidation() {
        console.log('\n=== 設定ファイル検証テスト ===');

        const configPath = path.join(__dirname, 'config.json');

        // テスト1: 設定ファイル存在
        await this.runTest('設定ファイル存在', () => {
            return fs.existsSync(configPath);
        });

        // テスト2: 設定ファイル構文
        await this.runTest('設定ファイル構文', () => {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                return config.projectName && 
                       config.autoUpdate && 
                       config.documentTargets &&
                       config.analysisPatterns;
            } catch (error) {
                return false;
            }
        });

        // テスト3: Gitフック存在
        await this.runTest('Gitフック存在', () => {
            const postCommitHook = path.join(this.projectRoot, '.git/hooks/post-commit');
            const prePushHook = path.join(this.projectRoot, '.git/hooks/pre-push');
            return fs.existsSync(postCommitHook) && fs.existsSync(prePushHook);
        });
    }

    async runTest(name, testFunction) {
        try {
            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            const testResult = {
                name,
                passed: !!result,
                duration,
                error: null
            };
            
            this.testResults.push(testResult);
            
            const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${status} ${name} (${duration}ms)`);
            
        } catch (error) {
            const testResult = {
                name,
                passed: false,
                duration: 0,
                error: error.message
            };
            
            this.testResults.push(testResult);
            console.log(`  ❌ FAIL ${name} - Error: ${error.message}`);
        }
    }

    printResults() {
        console.log('\n=== テスト結果サマリー ===');
        
        const passed = this.testResults.filter(test => test.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`総テスト数: ${total}`);
        console.log(`成功: ${passed}`);
        console.log(`失敗: ${total - passed}`);
        console.log(`成功率: ${passRate}%`);
        
        if (passed === total) {
            console.log('\n🎉 すべてのテストが成功しました！');
        } else {
            console.log('\n⚠️  いくつかのテストが失敗しました。');
            console.log('\n失敗したテスト:');
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.name}${test.error ? `: ${test.error}` : ''}`);
                });
        }
    }

    generateTestData() {
        return {
            featureAddition: `Human: 新しいチャット機能を実装してください。
Assistant: 了解しました。チャット機能を実装します。`,
            
            testing: `Human: テストを実行してください。
Assistant: テストを実行します。`,
            
            bugFix: `Human: バグを修正してください。
Assistant: バグ修正を行います。`,
            
            withFiles: `Human: docs/chat.htmlを更新してください。
Assistant: docs/chat.htmlを更新しました。`,
            
            comprehensive: `Human: 新機能を追加してテストを実行し、docs/feature.mdを更新してください。
Assistant: 機能追加、テスト実行、ドキュメント更新を完了しました。`
        };
    }
}

// テスト実行
if (require.main === module) {
    const tester = new AutomationTester();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}