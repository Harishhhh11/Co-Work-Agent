"""
Windows UI Automation & Accessibility Inspector
Integrates with Microsoft UI Automation (UIA) and Win32 Windowing:
- Traverses the live Windows Accessibility Tree
- Extracts ControlType, AutomationId, Name, BoundingRectangle (x, y, width, height)
- Locates UI buttons, text fields, menu items, tabs, and documents
- Provides Win32 window handles (HWND), active window detection, and window focusing
"""

import sys
from typing import List, Dict, Any, Optional

class WindowsUIAutomationEngine:
    """Real Windows UI Automation tree walker and inspector."""

    def __init__(self):
        self.is_windows = sys.platform == "win32"
        self._uia = None
        if self.is_windows:
            self._init_uia()

    def _init_uia(self):
        """Initializes COM UIAutomationClient interface."""
        try:
            import comtypes.client
            # CUIAutomation CLSID: {ff48dba4-60ef-4201-aa87-54103eef594e}
            self._uia = comtypes.client.CreateObject("{ff48dba4-60ef-4201-aa87-54103eef594e}")
        except Exception:
            # Fallback to pywinauto if available
            try:
                import pywinauto
                self._uia = pywinauto
            except Exception:
                pass

    def get_active_window_info(self) -> Dict[str, Any]:
        """Returns title, process name, class, and bounding rect of active window."""
        if not self.is_windows:
            return {
                "title": "Desktop Environment",
                "process_name": "explorer.exe",
                "hwnd": 0,
                "rect": {"x": 0, "y": 0, "width": 1920, "height": 1080}
            }

        try:
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.windll.user32
            hwnd = user32.GetForegroundWindow()
            if not hwnd:
                return {"title": "Desktop", "process_name": "explorer.exe", "hwnd": 0}

            length = user32.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buf, length + 1)
            title = buf.value

            rect = wintypes.RECT()
            user32.GetWindowRect(hwnd, ctypes.byref(rect))

            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

            return {
                "title": title,
                "hwnd": hwnd,
                "pid": pid.value,
                "rect": {
                    "x": rect.left,
                    "y": rect.top,
                    "width": rect.right - rect.left,
                    "height": rect.bottom - rect.top
                }
            }
        except Exception as e:
            return {"title": "Windows Desktop", "error": str(e)}

    def focus_window_by_title(self, query: str) -> bool:
        """Finds a top-level window matching query and brings it to the foreground."""
        if not self.is_windows:
            return True

        try:
            import ctypes
            user32 = ctypes.windll.user32

            matched_hwnd = None
            def enum_proc(hwnd, lparam):
                nonlocal matched_hwnd
                if not user32.IsWindowVisible(hwnd):
                    return True
                length = user32.GetWindowTextLengthW(hwnd)
                if length == 0:
                    return True
                buf = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buf, length + 1)
                if query.lower() in buf.value.lower():
                    matched_hwnd = hwnd
                    return False  # stop enumeration
                return True

            WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
            user32.EnumWindows(WNDENUMPROC(enum_proc), 0)

            if matched_hwnd:
                # SW_RESTORE = 9, SW_SHOW = 5
                user32.ShowWindow(matched_hwnd, 9)
                user32.SetForegroundWindow(matched_hwnd)
                return True
            return False
        except Exception:
            return False

    def get_ui_elements(self, max_depth: int = 3, target_hwnd: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Inspects UI Automation tree under active window or desktop root.
        Returns array of structured elements:
        [{ name, control_type, automation_id, rect: {x,y,width,height}, center_x, center_y }]
        """
        elements: List[Dict[str, Any]] = []

        if not self.is_windows:
            # Provide sample structural representation for development
            return [
                {
                    "name": "Google Chrome",
                    "control_type": "Window",
                    "automation_id": "Chrome_WidgetWin_1",
                    "rect": {"x": 100, "y": 50, "width": 1200, "height": 800},
                    "center_x": 700,
                    "center_y": 450,
                },
                {
                    "name": "New meeting",
                    "control_type": "Button",
                    "automation_id": "meet-new-btn",
                    "rect": {"x": 340, "y": 320, "width": 160, "height": 48},
                    "center_x": 420,
                    "center_y": 344,
                },
                {
                    "name": "Search or start new chat",
                    "control_type": "Edit",
                    "automation_id": "wa-search-input",
                    "rect": {"x": 120, "y": 140, "width": 280, "height": 36},
                    "center_x": 260,
                    "center_y": 158,
                }
            ]

        try:
            # Use UIAutomation COM interface to walk tree
            if self._uia:
                # Root or window element
                root = self._uia.GetRootElement() if not target_hwnd else self._uia.ElementFromHandle(target_hwnd)
                if root:
                    self._walk_element(root, elements, current_depth=0, max_depth=max_depth)
        except Exception:
            pass

        return elements

    def _walk_element(self, element, elements_list: list, current_depth: int, max_depth: int):
        if current_depth > max_depth or len(elements_list) > 150:
            return

        try:
            name = element.CurrentName or ""
            control_type = element.CurrentLocalizedControlType or str(element.CurrentControlType)
            automation_id = element.CurrentAutomationId or ""
            rect = element.CurrentBoundingRectangle

            # Skip empty non-interactive elements
            if rect and (rect.right - rect.left > 0) and (rect.bottom - rect.top > 0):
                w = rect.right - rect.left
                h = rect.bottom - rect.top
                cx = rect.left + w // 2
                cy = rect.top + h // 2

                if name or automation_id:
                    elements_list.append({
                        "name": name,
                        "control_type": control_type,
                        "automation_id": automation_id,
                        "rect": {"x": rect.left, "y": rect.top, "width": w, "height": h},
                        "center_x": cx,
                        "center_y": cy,
                    })

            # Traverse children using TreeWalker
            import comtypes.gen.UIAutomationClient as UIA
            walker = self._uia.RawViewWalker
            child = walker.GetFirstChildElement(element)
            while child:
                self._walk_element(child, elements_list, current_depth + 1, max_depth)
                child = walker.GetNextSiblingElement(child)
        except Exception:
            pass
