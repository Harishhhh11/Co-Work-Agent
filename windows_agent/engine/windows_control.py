"""
Native Windows Control Engine for Local Computer-Use AI Agent
Uses ctypes to invoke Win32 APIs directly:
- SendInput for hardware-level mouse and keyboard input
- OpenClipboard / GetClipboardData / SetClipboardData for Unicode text clipboard
- SetForegroundWindow, ShowWindow, GetWindowRect for window management
- Monitor DPI awareness configuration
"""

import sys
import time
import math
import ctypes
from ctypes import wintypes
from typing import Tuple, Optional, List, Dict, Any

# Win32 Constants
INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
INPUT_HARDWARE = 2

# Mouse flags
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_MIDDLEDOWN = 0x0020
MOUSEEVENTF_MIDDLEUP = 0x0040
MOUSEEVENTF_WHEEL = 0x0800
MOUSEEVENTF_HWHEEL = 0x1000
MOUSEEVENTF_ABSOLUTE = 0x8000

# Keyboard flags
KEYEVENTF_EXTENDEDKEY = 0x0001
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_UNICODE = 0x0004
KEYEVENTF_SCANCODE = 0x0008

# Clipboard formats
CF_UNICODETEXT = 13

# Virtual Key Codes
VK_MAP = {
    "enter": 0x0D,
    "return": 0x0D,
    "tab": 0x09,
    "space": 0x20,
    "backspace": 0x08,
    "escape": 0x1B,
    "esc": 0x1B,
    "delete": 0x2E,
    "shift": 0x10,
    "ctrl": 0x11,
    "control": 0x11,
    "alt": 0x12,
    "win": 0x5B,
    "windows": 0x5B,
    "up": 0x26,
    "down": 0x28,
    "left": 0x25,
    "right": 0x27,
    "home": 0x24,
    "end": 0x23,
    "pageup": 0x21,
    "pagedown": 0x22,
    "f1": 0x70,
    "f2": 0x71,
    "f3": 0x72,
    "f4": 0x73,
    "f5": 0x74,
    "f6": 0x75,
    "f7": 0x76,
    "f8": 0x77,
    "f9": 0x78,
    "f10": 0x79,
    "f11": 0x7A,
    "f12": 0x7B,
}

# CTypes Structures for Win32 SendInput
class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ("dx", wintypes.LONG),
        ("dy", wintypes.LONG),
        ("mouseData", wintypes.DWORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(wintypes.ULONG)),
    ]

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk", wintypes.WORD),
        ("wScan", wintypes.WORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(wintypes.ULONG)),
    ]

class HARDWAREINPUT(ctypes.Structure):
    _fields_ = [
        ("uMsg", wintypes.DWORD),
        ("wParamL", wintypes.WORD),
        ("wParamH", wintypes.WORD),
    ]

class INPUT_UNION(ctypes.Union):
    _fields_ = [
        ("mi", MOUSEINPUT),
        ("ki", KEYBDINPUT),
        ("hi", HARDWAREINPUT),
    ]

class INPUT(ctypes.Structure):
    _fields_ = [
        ("type", wintypes.DWORD),
        ("union", INPUT_UNION),
    ]


class WindowsControlEngine:
    """Production Win32 Computer Control Engine."""

    def __init__(self):
        self.is_windows = sys.platform == "win32"
        self._user32 = None
        self._kernel32 = None
        self.is_input_frozen = False
        
        if self.is_windows:
            self._user32 = ctypes.windll.user32
            self._kernel32 = ctypes.windll.kernel32
            self._init_dpi_awareness()

    def freeze_user_input(self, block: bool = True) -> bool:
        """
        Freezes physical user mouse and keyboard input on Windows
        to avoid interference while the autonomous AI agent is operating.
        Uses Win32 BlockInput API. Synthetic SendInput events dispatched
        by the AI agent continue to operate.
        """
        self.is_input_frozen = block
        if self.is_windows and self._user32:
            try:
                res = self._user32.BlockInput(wintypes.BOOL(block))
                return bool(res)
            except Exception as e:
                print(f"[WindowsControl] BlockInput status: {e}")
                return False
        return True

    def unfreeze_user_input(self) -> bool:
        """Restores physical user input immediately."""
        return self.freeze_user_input(False)

    def _init_dpi_awareness(self):
        """Set per-monitor DPI awareness to ensure exact pixel mapping."""
        try:
            # DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = -4
            ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
        except Exception:
            try:
                ctypes.windll.shcore.SetProcessDpiAwareness(2)
            except Exception:
                pass

    def get_screen_resolution(self) -> Tuple[int, int]:
        """Returns primary monitor resolution (width, height)."""
        if self.is_windows and self._user32:
            w = self._user32.GetSystemMetrics(0)  # SM_CXSCREEN
            h = self._user32.GetSystemMetrics(1)  # SM_CYSCREEN
            return (w, h)
        return (1920, 1080)

    def get_cursor_position(self) -> Tuple[int, int]:
        """Returns current mouse cursor (x, y) coordinates."""
        if self.is_windows and self._user32:
            point = wintypes.POINT()
            if self._user32.GetCursorPos(ctypes.byref(point)):
                return (point.x, point.y)
        return (0, 0)

    def move_mouse(self, x: int, y: int, smooth: bool = True, duration: float = 0.2):
        """
        Move mouse to target (x, y). Supports natural human-like Bezier curve movement.
        """
        if not self.is_windows or not self._user32:
            return

        cur_x, cur_y = self.get_cursor_position()
        
        if not smooth or duration <= 0:
            self._user32.SetCursorPos(int(x), int(y))
            return

        # Bezier curve interpolation for smooth natural motion
        steps = max(10, int(duration * 60))
        control_x = (cur_x + x) // 2 + (y - cur_y) // 4
        control_y = (cur_y + y) // 2 + (cur_x - x) // 4
        
        sleep_interval = duration / steps
        for i in range(1, steps + 1):
            t = i / steps
            # Quadratic Bezier
            inter_x = int((1 - t)**2 * cur_x + 2 * (1 - t) * t * control_x + t**2 * x)
            inter_y = int((1 - t)**2 * cur_y + 2 * (1 - t) * t * control_y + t**2 * y)
            self._user32.SetCursorPos(inter_x, inter_y)
            time.sleep(sleep_interval)

        self._user32.SetCursorPos(int(x), int(y))

    def mouse_click(self, x: Optional[int] = None, y: Optional[int] = None, button: str = "left", clicks: int = 1, interval: float = 0.08):
        """Perform mouse click at (x, y) or current position."""
        if x is not None and y is not None:
            self.move_mouse(x, y)

        if not self.is_windows or not self._user32:
            return

        down_flag, up_flag = MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP
        if button.lower() == "right":
            down_flag, up_flag = MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP
        elif button.lower() == "middle":
            down_flag, up_flag = MOUSEEVENTF_MIDDLEDOWN, MOUSEEVENTF_MIDDLEUP

        for _ in range(clicks):
            # Mouse Down
            input_down = INPUT(type=INPUT_MOUSE)
            input_down.union.mi = MOUSEINPUT(dx=0, dy=0, mouseData=0, dwFlags=down_flag, time=0, dwExtraInfo=None)
            self._user32.SendInput(1, ctypes.byref(input_down), ctypes.sizeof(INPUT))
            
            time.sleep(0.04)
            
            # Mouse Up
            input_up = INPUT(type=INPUT_MOUSE)
            input_up.union.mi = MOUSEINPUT(dx=0, dy=0, mouseData=0, dwFlags=up_flag, time=0, dwExtraInfo=None)
            self._user32.SendInput(1, ctypes.byref(input_up), ctypes.sizeof(INPUT))
            
            if clicks > 1:
                time.sleep(interval)

    def mouse_drag(self, start_x: int, start_y: int, end_x: int, end_y: int, duration: float = 0.5):
        """Drag from (start_x, start_y) to (end_x, end_y)."""
        self.move_mouse(start_x, start_y)
        time.sleep(0.05)
        
        # Left down
        input_down = INPUT(type=INPUT_MOUSE)
        input_down.union.mi = MOUSEINPUT(dx=0, dy=0, mouseData=0, dwFlags=MOUSEEVENTF_LEFTDOWN, time=0, dwExtraInfo=None)
        self._user32.SendInput(1, ctypes.byref(input_down), ctypes.sizeof(INPUT))
        time.sleep(0.05)
        
        # Move smoothly to destination
        self.move_mouse(end_x, end_y, smooth=True, duration=duration)
        time.sleep(0.05)
        
        # Left up
        input_up = INPUT(type=INPUT_MOUSE)
        input_up.union.mi = MOUSEINPUT(dx=0, dy=0, mouseData=0, dwFlags=MOUSEEVENTF_LEFTUP, time=0, dwExtraInfo=None)
        self._user32.SendInput(1, ctypes.byref(input_up), ctypes.sizeof(INPUT))

    def mouse_scroll(self, clicks: int, horizontal: bool = False):
        """Scroll mouse wheel vertically or horizontally."""
        if not self.is_windows or not self._user32:
            return
        
        flag = MOUSEEVENTF_HWHEEL if horizontal else MOUSEEVENTF_WHEEL
        amount = int(clicks * 120)  # WHEEL_DELTA is 120 in Win32
        
        input_scroll = INPUT(type=INPUT_MOUSE)
        input_scroll.union.mi = MOUSEINPUT(dx=0, dy=0, mouseData=amount, dwFlags=flag, time=0, dwExtraInfo=None)
        self._user32.SendInput(1, ctypes.byref(input_scroll), ctypes.sizeof(INPUT))

    def key_down(self, key: str):
        """Press and hold a key."""
        if not self.is_windows or not self._user32:
            return
        
        vk = VK_MAP.get(key.lower(), ord(key.upper()) if len(key) == 1 else 0)
        inp = INPUT(type=INPUT_KEYBOARD)
        inp.union.ki = KEYBDINPUT(wVk=vk, wScan=0, dwFlags=0, time=0, dwExtraInfo=None)
        self._user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

    def key_up(self, key: str):
        """Release a held key."""
        if not self.is_windows or not self._user32:
            return
        
        vk = VK_MAP.get(key.lower(), ord(key.upper()) if len(key) == 1 else 0)
        inp = INPUT(type=INPUT_KEYBOARD)
        inp.union.ki = KEYBDINPUT(wVk=vk, wScan=0, dwFlags=KEYEVENTF_KEYUP, time=0, dwExtraInfo=None)
        self._user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

    def press_key(self, key: str):
        """Press and immediately release a key."""
        self.key_down(key)
        time.sleep(0.04)
        self.key_up(key)

    def hotkey(self, *keys: str):
        """Execute a keyboard shortcut combination (e.g. ['ctrl', 'c'])."""
        for k in keys:
            self.key_down(k)
            time.sleep(0.02)
        time.sleep(0.05)
        for k in reversed(keys):
            self.key_up(k)
            time.sleep(0.02)

    def type_text(self, text: str, delay_per_char: float = 0.02):
        """
        Type arbitrary Unicode text using KEYEVENTF_UNICODE for 100% faithful input.
        """
        if not self.is_windows or not self._user32:
            return

        for char in text:
            code = ord(char)
            # Unicode Down
            inp_down = INPUT(type=INPUT_KEYBOARD)
            inp_down.union.ki = KEYBDINPUT(wVk=0, wScan=code, dwFlags=KEYEVENTF_UNICODE, time=0, dwExtraInfo=None)
            self._user32.SendInput(1, ctypes.byref(inp_down), ctypes.sizeof(INPUT))
            
            # Unicode Up
            inp_up = INPUT(type=INPUT_KEYBOARD)
            inp_up.union.ki = KEYBDINPUT(wVk=0, wScan=code, dwFlags=KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, time=0, dwExtraInfo=None)
            self._user32.SendInput(1, ctypes.byref(inp_up), ctypes.sizeof(INPUT))
            
            if delay_per_char > 0:
                time.sleep(delay_per_char)

    def get_clipboard(self) -> str:
        """Read Unicode text from the real Windows clipboard."""
        if not self.is_windows or not self._user32:
            return ""

        if not self._user32.OpenClipboard(None):
            return ""

        text = ""
        try:
            handle = self._user32.GetClipboardData(CF_UNICODETEXT)
            if handle:
                p_text = self._kernel32.GlobalLock(handle)
                if p_text:
                    text = ctypes.c_wchar_p(p_text).value or ""
                    self._kernel32.GlobalUnlock(handle)
        finally:
            self._user32.CloseClipboard()
        return text

    def set_clipboard(self, text: str) -> bool:
        """Write Unicode text to the real Windows clipboard."""
        if not self.is_windows or not self._user32:
            return False

        if not self._user32.OpenClipboard(None):
            return False

        try:
            self._user32.EmptyClipboard()
            # Allocate movable global memory
            GMEM_MOVEABLE = 0x0002
            buf = ctypes.create_unicode_buffer(text)
            size = ctypes.sizeof(buf)
            
            h_mem = self._kernel32.GlobalAlloc(GMEM_MOVEABLE, size)
            if h_mem:
                p_mem = self._kernel32.GlobalLock(h_mem)
                ctypes.memmove(p_mem, buf, size)
                self._kernel32.GlobalUnlock(h_mem)
                self._user32.SetClipboardData(CF_UNICODETEXT, h_mem)
                return True
        finally:
            self._user32.CloseClipboard()
        return False
