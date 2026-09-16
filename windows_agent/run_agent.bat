@echo off
title Local Windows Computer-Use AI Agent
echo ===================================================================
echo      LOCAL WINDOWS COMPUTER-USE AI AGENT (RUN DAEMON AND DESKTOP)
echo ===================================================================
echo.

cd /d "%~dp0\.."

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.10+ is required on this Windows machine.
    echo Please install Python from https://www.python.org/ or Windows Store.
    pause
    exit /b 1
)

:: Install python dependencies if needed
echo [*] Checking Python dependencies...
python -m pip install --quiet Pillow comtypes pywinauto mss
if %errorlevel% neq 0 (
    echo [!] Warning: Some optional Win32 packages failed to install, using native ctypes fallback.
)

echo [*] Launching Native Windows Agent Daemon on http://127.0.0.1:8765 ...
start "Local Agent Daemon" python -m windows_agent.agent_daemon 8765

:: Check if Node.js & npm are available
where npm >nul 2>&1
if %errorlevel% equ 0 (
    if not exist "node_modules\tsx" (
        echo [*] Installing Node dependencies (first-time setup, please wait)...
        call npm install
    )
    echo [*] Starting Local Desktop App on http://localhost:3000 ...
    timeout /t 2 >nul
    start http://localhost:3000
    call npm run dev
) else (
    echo [*] Node.js not found. Opening built-in Agent Controller at http://127.0.0.1:8765 ...
    timeout /t 2 >nul
    start http://127.0.0.1:8765
    echo.
    echo ===================================================================
    echo   DAEMON IS ACTIVE on http://127.0.0.1:8765
    echo   Control your computer directly via your browser.
    echo   Press Ctrl+C in this terminal when finished.
    echo ===================================================================
    pause
)
