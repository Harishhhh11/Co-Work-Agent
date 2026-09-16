@echo off
setlocal enabledelayedexpansion
title Install Local Computer Agent Desktop Application

echo ===================================================================
echo     INSTALLING LOCAL COMPUTER AGENT AS WINDOWS DESKTOP APP
echo ===================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python & Installing Automation Engine dependencies...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

python -m pip install -r requirements.txt

echo [2/3] Creating Windows Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut([System.IO.Path]::Combine($desktop, 'Local Computer Agent.lnk')); $s.TargetPath = '%~dp0run_desktop_app.bat'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = 'shell32.dll,14'; $s.Description = 'Local Computer Agent - Autonomous AI Windows Desktop Automation'; $s.Save()"

echo.
echo ===================================================================
echo  INSTALLATION SUCCESSFUL!
echo.
echo  [+] Shortcut created on your Windows Desktop:
echo      "Local Computer Agent"
echo.
echo  [+] You can now launch it directly from your Desktop anytime!
echo      It will open as a standalone Desktop Window with zero browser tabs.
echo ===================================================================
echo.
set /p LAUNCH="Would you like to launch Local Computer Agent now? (Y/N): "
if /i "%LAUNCH%"=="Y" (
    start "" "%~dp0run_desktop_app.bat"
)
