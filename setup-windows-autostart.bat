@echo off
TITLE WhatsApp AI Task Manager - Windows Background Setup
COLOR 0A
echo ============================================================
echo   WhatsApp AI Task Manager - Windows Autostart Setup
echo ============================================================
echo.

set SCRIPT_DIR=%~dp0
set VBS_FILE=%SCRIPT_DIR%start-windows-background.vbs
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\WhatsAppAITaskManager.lnk

echo Creating Windows Startup Shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%VBS_FILE%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "WhatsApp AI Task Manager Background Service" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

echo.
echo ============================================================
echo  SUCCESS! App registered to start automatically on Windows boot!
echo  Location: %SHORTCUT_PATH%
echo  The server will now run silently in background on startup.
echo ============================================================
echo.
echo Launching background service now...
wscript "%VBS_FILE%"
echo Done! You can close this window.
pause
