"""
Windows Application Discovery & Launching Controller
Discovers installed applications via:
- Registry: HKLM & HKCU Software\\Microsoft\\Windows\\CurrentVersion\\App Paths
- Start Menu shortcuts (.lnk) in ProgramData and User AppData
- PATH and standard Windows system directories
- Process launching with ShellExecuteW or subprocess
"""

import os
import sys
import subprocess
from typing import Dict, List, Optional, Any

# Common fallback mappings for rapid recognition
COMMON_SYSTEM_APPS = {
    "chrome": "chrome.exe",
    "google chrome": "chrome.exe",
    "edge": "msedge.exe",
    "microsoft edge": "msedge.exe",
    "firefox": "firefox.exe",
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "calc": "calc.exe",
    "file explorer": "explorer.exe",
    "explorer": "explorer.exe",
    "excel": "excel.exe",
    "word": "winword.exe",
    "powerpoint": "powerpnt.exe",
    "vs code": "code.cmd",
    "vscode": "code.cmd",
    "terminal": "wt.exe",
    "powershell": "powershell.exe",
    "cmd": "cmd.exe",
    "whatsapp": "whatsapp.exe",
    "telegram": "telegram.exe",
    "slack": "slack.exe",
    "discord": "discord.exe",
}

class WindowsAppDiscovery:
    """Discovers and launches real Windows applications."""

    def __init__(self):
        self.is_windows = sys.platform == "win32"
        self._installed_cache: Dict[str, str] = {}

    def discover_installed_applications(self) -> Dict[str, str]:
        """Scans Windows Registry & Start Menu for installed executables."""
        if not self.is_windows:
            return COMMON_SYSTEM_APPS.copy()

        apps = {}
        # 1. Check Registry App Paths
        try:
            import winreg
            for root_key in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
                try:
                    with winreg.OpenKey(root_key, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths") as key:
                        count = winreg.QueryInfoKey(key)[0]
                        for i in range(count):
                            try:
                                subkey_name = winreg.EnumKey(key, i)
                                with winreg.OpenKey(key, subkey_name) as subkey:
                                    path, _ = winreg.QueryValueEx(subkey, "")
                                    clean_name = os.path.splitext(subkey_name)[0].lower()
                                    apps[clean_name] = path
                            except Exception:
                                pass
                except Exception:
                    pass
        except Exception:
            pass

        # 2. Check Start Menu directories
        start_menu_dirs = [
            os.path.expandvars(r"%ProgramData%\Microsoft\Windows\Start Menu\Programs"),
            os.path.expandvars(r"%APPDATA%\Microsoft\Windows\Start Menu\Programs"),
        ]
        for sdir in start_menu_dirs:
            if os.path.exists(sdir):
                for root, _, files in os.walk(sdir):
                    for f in files:
                        if f.lower().endswith(".lnk"):
                            app_name = os.path.splitext(f)[0].lower()
                            full_path = os.path.join(root, f)
                            apps[app_name] = full_path

        # 3. Merge with common apps
        for name, cmd in COMMON_SYSTEM_APPS.items():
            if name not in apps:
                apps[name] = cmd

        self._installed_cache = apps
        return apps

    def find_application_path(self, app_name: str) -> Optional[str]:
        """Finds application path or executable name for a given app name query."""
        app_name_clean = app_name.strip().lower()
        
        # Exact match in common system apps
        if app_name_clean in COMMON_SYSTEM_APPS:
            return COMMON_SYSTEM_APPS[app_name_clean]

        # Scan if cache is empty
        if not self._installed_cache:
            self.discover_installed_applications()

        # Direct match in cache
        if app_name_clean in self._installed_cache:
            return self._installed_cache[app_name_clean]

        # Partial substring match
        for name, path in self._installed_cache.items():
            if app_name_clean in name or name in app_name_clean:
                return path

        return app_name_clean + ".exe"

    def launch_application(self, app_name: str, arguments: Optional[str] = None) -> Dict[str, Any]:
        """
        Launches the application on Windows using os.startfile or ShellExecute.
        """
        target = self.find_application_path(app_name)
        if not target:
            target = app_name

        if not self.is_windows:
            return {
                "success": True,
                "app": app_name,
                "target": target,
                "status": f"Launched {app_name} (Simulation/Container)",
            }

        try:
            if arguments:
                # Use ShellExecute or subprocess
                import ctypes
                user32 = ctypes.windll.shell32
                res = user32.ShellExecuteW(None, "open", target, arguments, None, 1)  # SW_SHOWNORMAL = 1
                if res > 32:
                    return {"success": True, "app": app_name, "target": target, "status": "Launched"}
                else:
                    subprocess.Popen(f'"{target}" {arguments}', shell=True)
                    return {"success": True, "app": app_name, "target": target, "status": "Launched via subprocess"}
            else:
                os.startfile(target)
                return {"success": True, "app": app_name, "target": target, "status": "Launched via os.startfile"}
        except Exception as e:
            # Fallback to subprocess
            try:
                subprocess.Popen(target, shell=True)
                return {"success": True, "app": app_name, "target": target, "status": f"Launched via fallback ({e})"}
            except Exception as e2:
                return {"success": False, "app": app_name, "target": target, "error": str(e2)}
