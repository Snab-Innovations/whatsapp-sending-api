@echo off
TITLE WhatsApp AI Task Manager - Uninstall Windows Autostart
COLOR 0C
echo Removing WhatsApp AI Task Manager from Windows Startup...

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\WhatsAppAITaskManager.lnk

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo ✅ Removed shortcut from Startup folder!
) else (
    echo ℹ️ Autostart shortcut was not found.
)

echo Done!
pause
