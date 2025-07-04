#!/bin/bash

# Claude Code 自動更新スケジューラー状態確認スクリプト

AUTOMATION_DIR="/Users/aa479881/Library/CloudStorage/OneDrive-IBM/Personal/development/frontoffice/automation"
PID_FILE="$AUTOMATION_DIR/scheduler.pid"
LOG_FILE="$AUTOMATION_DIR/scheduler.log"

echo "=== Claude Code 自動更新スケジューラー状態 ==="

if [ ! -f "$PID_FILE" ]; then
    echo "❌ ステータス: 停止中"
    echo ""
    echo "開始するには: ./start-scheduler.sh"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "✅ ステータス: 実行中"
    echo "📝 PID: $PID"
    
    # プロセス開始時刻を取得
    if command -v ps &> /dev/null; then
        START_TIME=$(ps -p "$PID" -o lstart= 2>/dev/null)
        if [ -n "$START_TIME" ]; then
            echo "🕐 開始時刻: $START_TIME"
        fi
    fi
    
    echo ""
    echo "コマンド:"
    echo "  ログ確認: tail -f $LOG_FILE"
    echo "  停止: ./stop-scheduler.sh"
    
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "=== 最新ログ (最後の10行) ==="
        tail -10 "$LOG_FILE"
    fi
else
    echo "❌ ステータス: 停止中 (PIDファイルは存在するがプロセスなし)"
    rm -f "$PID_FILE"
    echo ""
    echo "開始するには: ./start-scheduler.sh"
fi