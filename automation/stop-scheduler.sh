#!/bin/bash

# Claude Code 自動更新スケジューラー停止スクリプト

AUTOMATION_DIR="/Users/aa479881/Library/CloudStorage/OneDrive-IBM/Personal/development/frontoffice/automation"
PID_FILE="$AUTOMATION_DIR/scheduler.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "スケジューラーは実行されていません"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "スケジューラーを停止中... (PID: $PID)"
    kill "$PID"
    
    # プロセスが終了するまで待機
    sleep 2
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "強制終了中..."
        kill -9 "$PID"
    fi
    
    rm -f "$PID_FILE"
    echo "✅ スケジューラーが停止しました"
else
    echo "プロセス (PID: $PID) は既に終了しています"
    rm -f "$PID_FILE"
fi