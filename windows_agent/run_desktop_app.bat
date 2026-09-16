@echo off
setlocal enabledelayedexpansion
title Local Computer Agent - Desktop Launcher

echo ===================================================================
echo             STARTING LOCAL COMPUTER AGENT (DESKTOP MODE)
echo ===================================================================
echo.

cd /d "%~dp0"

:: 1. Ensure Python dependencies are installed
python -c "import win32api" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] Installing required Win32 automation libraries...
    python -m pip install -r requirements.txt --quiet
)

:: 2. Check if agent daemon is already running on port 8765
powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 8765); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] Starting Local Windows Agent Engine daemon...
    start "Local Agent Daemon" /b python agent_daemon.py 8765
    timeout /t 2 /nobreak >nul
) else (
    echo [*] Local Windows Agent Engine daemon already running.
)

:: 3. Launch as Native Desktop Application Window (Frameless app mode, no browser URL bar)
echo [*] Launching Native Windows Desktop Window...

:: Try Microsoft Edge App Mode (built into every Windows 10/11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="http://127.0.0.1:8765" --window-size=1280,840 --window-position=100,80
    goto :done
)

:: Try Google Chrome App Mode
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="http://127.0.0.1:8765" --window-size=1280,840 --window-position=100,80
    goto :done
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="http://127.0.0.1:8765" --window-size=1280,840 --window-position=100,80
    goto :done
)

:: Fallback to default browser if app mode binary not located
start http://127.0.0.1:8765

:done
echo.
echo ===================================================================
echo  Local Computer Agent Desktop Window is active!
echo  Press Ctrl+Alt+S anytime on Windows for Emergency Stop.
echo ===================================================================
