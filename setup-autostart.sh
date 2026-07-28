#!/bin/bash

# 🚀 macOS Automatic Background Startup Configurator for WhatsApp AI Task Manager

APP_DIR="/Users/aaradhyapathak/unlimitedwp chats fetch/server"
PLIST_PATH="$HOME/Library/LaunchAgents/com.whatsapp.taskmanager.plist"
LOG_DIR="$HOME/Library/Logs/WhatsAppTaskManager"

mkdir -p "$LOG_DIR"
mkdir -p "$HOME/Library/LaunchAgents"

NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  NODE_PATH="/usr/local/bin/node"
fi

echo "Installing LaunchAgent at $PLIST_PATH..."

cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.whatsapp.taskmanager</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$APP_DIR/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$APP_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/server.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/server-error.log</string>
</dict>
</plist>
EOF

# Unload existing daemon if running
launchctl unload "$PLIST_PATH" 2>/dev/null

# Load new daemon
launchctl load -w "$PLIST_PATH"

echo "============================================================"
echo "✅ SUCCESS! WhatsApp AI Task Manager background service active."
echo "🟢 It will automatically start whenever your Mac turns on or logs in."
echo "🚫 NO NEED to open any terminal window!"
echo "🤖 Auto-fetches messages, analyzes via Gemini AI, and syncs to Firebase."
echo "============================================================"
echo "📄 Log file: $LOG_DIR/server.log"
echo "📄 Error log: $LOG_DIR/server-error.log"
