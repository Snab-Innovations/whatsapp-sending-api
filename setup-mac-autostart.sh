#!/bin/bash

PROJECT_DIR="/Users/aaradhyapathak/unlimitedwp chats fetch"
PLIST_LABEL="com.whatsapp.taskmanager"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_LABEL.plist"

chmod +x "$PROJECT_DIR/scripts/start-background.sh"
chmod +x "$PROJECT_DIR/scripts/stop-background.sh"

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$PROJECT_DIR/logs"

# Unload previous plist if exists
launchctl unload "$PLIST_PATH" 2>/dev/null

cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${PROJECT_DIR}/scripts/start-background.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${PROJECT_DIR}/logs/launchagent.log</string>
    <key>StandardErrorPath</key>
    <string>${PROJECT_DIR}/logs/launchagent.err</string>
</dict>
</plist>
EOF

chmod 644 "$PLIST_PATH"
launchctl load "$PLIST_PATH"

echo "✅ macOS Login Auto-Start configured successfully!"
echo "🚀 WhatsApp AI Task Manager will now start automatically whenever you turn on or unlock your Mac."
