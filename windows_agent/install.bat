@echo off
setlocal enabledelayedexpansion
title Local Computer Agent - One-Click Installer & Launcher
echo ===================================================================
echo     LOCAL WINDOWS COMPUTER-USE AI AGENT (ONE-CLICK SETUP)
echo ===================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python installation
echo [*] Checking Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python 3.10+ was not found on your system PATH.
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo **CRITICAL**: Make sure to check "Add python.exe to PATH" during installation!
    echo.
    pause
    exit /b 1
)

python --version

:: 2. Install Python Win32 Automation Dependencies
echo.
echo [*] Installing Windows automation dependencies (pywinauto, Pillow, mss, comtypes)...
python -m pip install --quiet --upgrade pip
python -m pip install -r "%~dp0requirements.txt"
if %ERRORLEVEL% NEQ 0 (
    echo [!] Standard install warning, attempting essential packages...
    python -m pip install Pillow mss comtypes pywin32
)

:: 3. Create Windows Desktop Shortcut
echo.
echo [*] Creating Desktop shortcut "Local Computer Agent"...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut([System.IO.Path]::Combine($desktop, 'Local Computer Agent.lnk')); $s.TargetPath = '%~dp0run_desktop_app.bat'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = 'shell32.dll,14'; $s.Description = 'Local Computer Agent - Autonomous AI Windows Desktop Automation'; $s.Save()" 2>nul

echo.
echo ===================================================================
echo  SETUP COMPLETED SUCCESSFULLY!
echo ===================================================================
echo.
echo  [+] Local Windows automation engine is ready.
echo  [+] Launching the Agent Controller now...
echo.

timeout /t 2 >nul
start "" "%~dp0run_desktop_app.bat"

