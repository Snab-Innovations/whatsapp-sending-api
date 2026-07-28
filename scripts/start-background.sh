#!/bin/bash

PROJECT_DIR="/Users/aaradhyapathak/unlimitedwp chats fetch"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

# Free up ports 5001 and 5173 if busy
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# 1. Start Node.js Backend Server
cd "$PROJECT_DIR/server" || exit 1
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
nohup /usr/local/bin/node server.js >> "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!

# 2. Start Vite Frontend Dev Server
cd "$PROJECT_DIR/client" || exit 1
nohup /usr/local/bin/npm run dev >> "$LOG_DIR/client.log" 2>&1 &
CLIENT_PID=$!

echo "[$(date)] WhatsApp AI Task Manager started silently in background. Server PID: $SERVER_PID, Client PID: $CLIENT_PID" >> "$LOG_DIR/autostart.log"

cleanup() {
    echo "[$(date)] Stopping background processes (Server PID: $SERVER_PID, Client PID: $CLIENT_PID)..." >> "$LOG_DIR/autostart.log"
    kill -9 "$SERVER_PID" "$CLIENT_PID" 2>/dev/null
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait $SERVER_PID $CLIENT_PID

