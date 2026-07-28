' Windows Hidden Background Launcher for WhatsApp AI Task Manager
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get server directory path relative to this script
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
ServerDir = ScriptDir & "\server"

' Execute node server.js silently (0 = hide window, false = don't wait for finish)
WshShell.CurrentDirectory = ServerDir
WshShell.Run "cmd /c node server.js > logs-background.log 2>&1", 0, False
