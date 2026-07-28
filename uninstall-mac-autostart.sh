#!/bin/bash

PLIST_LABEL="com.whatsapp.taskmanager"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_LABEL.plist"

if [ -f "$PLIST_PATH" ]; then
    launchctl unload "$PLIST_PATH" 2>/dev/null
    rm "$PLIST_PATH"
    echo "✅ macOS Auto-Start service removed successfully."
else
    echo "Auto-Start service is not installed."
fi
