#!/bin/bash

# Claude Code 自動更新スケジューラー起動スクリプト

PROJECT_ROOT="/Users/aa479881/Library/CloudStorage/OneDrive-IBM/Personal/development/frontoffice"
AUTOMATION_DIR="$PROJECT_ROOT/automation"
PID_FILE="$AUTOMATION_DIR/scheduler.pid"
LOG_FILE="$AUTOMATION_DIR/scheduler.log"

# 既存のスケジューラーが動作中かチェック
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "スケジューラーは既に実行中です (PID: $PID)"
            echo "ログを確認するには: tail -f $LOG_FILE"
            exit 1
        else
            # PIDファイルが残っているが、プロセスが存在しない場合は削除
            rm -f "$PID_FILE"
        fi
    fi
}

# スケジューラー開始
start_scheduler() {
    echo "Claude Code 自動更新スケジューラーを開始しています..."
    echo "プロジェクトディレクトリ: $PROJECT_ROOT"
    echo "ログファイル: $LOG_FILE"
    
    cd "$AUTOMATION_DIR"
    
    # バックグラウンドでスケジューラーを実行
    nohup node scheduler.js > "$LOG_FILE" 2>&1 &
    SCHEDULER_PID=$!
    
    # PIDファイルに保存
    echo "$SCHEDULER_PID" > "$PID_FILE"
    
    echo "スケジューラーが開始されました (PID: $SCHEDULER_PID)"
    echo ""
    echo "コマンド:"
    echo "  ログ確認: tail -f $LOG_FILE"
    echo "  停止: ./stop-scheduler.sh"
    echo "  ステータス: ./status-scheduler.sh"
}

# Node.jsの存在確認
if ! command -v node &> /dev/null; then
    echo "エラー: Node.jsがインストールされていません"
    exit 1
fi

# 実行権限の確認
if [ ! -x "$0" ]; then
    echo "実行権限を設定しています..."
    chmod +x "$0"
fi

# メイン処理
check_running
start_scheduler