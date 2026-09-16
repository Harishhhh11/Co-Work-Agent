# Local Computer Agent — Windows Desktop Application

This application allows an autonomous AI agent to interact with your local Windows operating system (controlling Google Chrome, Google Meet, WhatsApp, Notepad, Explorer, File System, etc.) using hardware-level Win32 `SendInput`, Microsoft UI Automation, and local screen capture.

---

## 🚀 How to Install and Run as a Desktop Application

You have two simple options to run this directly as a Windows desktop app:

### Option 1: 1-Click Desktop App Setup (Recommended)
1. Double-click **`windows_agent\install_desktop_app.bat`**.
2. This will:
   - Install required Windows automation packages (`pywin32`, `pyautogui`, `pillow`, `uiautomation`).
   - Automatically place a **"Local Computer Agent"** shortcut icon directly on your **Windows Desktop**.
   - Launch the agent in a **dedicated, frameless native Desktop App window** (no browser tabs, no URL address bar, separate Windows taskbar icon).

3. From now on, whenever you want to use the agent, just **double-click the icon on your Desktop**!

---

### Option 2: Compile Standalone `LocalComputerAgent.exe` (Electron + Inno Setup)
If you want an official standalone `.exe` installer or portable executable:

1. Double-click **`windows_agent\install.bat`**.
2. It will:
   - Install Node.js packages and compile the frontend.
   - Run `npx electron-builder --win` to build `LocalComputerAgent.exe`.
   - Optionally build the Inno Setup installer `LocalComputerAgent-Setup.exe` from `installer/setup.iss`.

---

## 🛡️ Safety & Emergency Controls
- **Global Emergency Stop Hotkey**: Press **`Ctrl + Alt + S`** anytime anywhere on Windows to instantly cut off all mouse and keyboard automation.
- **Escape Key**: Pressing `Esc` when the window is focused halts execution immediately.
- **Emergency Stop Button**: Big red button in the top title bar of the desktop app.
