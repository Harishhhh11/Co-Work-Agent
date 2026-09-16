"""
Security Boundary & Permission Confirmation Manager
Enforces strict safeguards:
- Identifies sensitive actions (messaging, purchases, file deletions, system changes)
- Halts execution until user approves via UI or confirmation prompt
- Emergency Stop state management (instant abort across all threads)
- Audit log of every OS-level operation executed
"""

import time
from typing import Dict, Any, Optional, List

class SecurityLevel:
    NORMAL = "normal"
    STRICT = "strict"  # Ask for almost all external actions
    AUTONOMOUS = "autonomous"  # Only ask for highly critical actions

class SecurityValidator:
    """Validates actions before execution against security policies."""

    SENSITIVE_ACTIONS = {
        "send_message": "Send a chat message or email",
        "delete_file": "Delete file or directory from filesystem",
        "purchase": "Financial transaction or purchase",
        "install_software": "Run installer or execute arbitrary binary",
        "system_config": "Modify system settings or registry",
    }

    def __init__(self, mode: str = SecurityLevel.NORMAL):
        self.mode = mode
        self.emergency_stop_triggered = False
        self.pending_confirmation: Optional[Dict[str, Any]] = None
        self.audit_log: List[Dict[str, Any]] = []

    def trigger_emergency_stop(self, reason: str = "User pressed Emergency Stop button"):
        """Instantly halts all computer control operations."""
        self.emergency_stop_triggered = True
        self.pending_confirmation = None
        self.log_event("EMERGENCY_STOP", {"reason": reason, "timestamp": time.time()})

    def reset_emergency_stop(self):
        """Clears emergency stop state to resume operations."""
        self.emergency_stop_triggered = False

    def is_action_sensitive(self, action_type: str, params: Dict[str, Any]) -> bool:
        """Determines if an action requires explicit user confirmation."""
        # 1. Explicit sensitive action types
        if action_type in self.SENSITIVE_ACTIONS:
            return True

        # 2. Text typing that contains send trigger or WhatsApp/Slack enter
        if action_type == "type_and_enter" and params.get("target_app", "").lower() in ["whatsapp", "slack", "telegram", "outlook"]:
            return True

        # 3. Mouse clicking an element labeled 'Send', 'Submit', 'Pay', 'Delete', 'Buy'
        if action_type in ["click_element", "mouse_click"]:
            label = str(params.get("label", "")).lower()
            critical_labels = ["send", "submit order", "pay now", "delete", "format", "buy now", "confirm transfer"]
            if any(cl in label for cl in critical_labels):
                return True

        # 4. Filesystem delete
        if action_type == "fs_delete":
            return True

        return False

    def request_approval(self, action_id: str, action_type: str, description: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Sets a pending confirmation that the UI will display."""
        self.pending_confirmation = {
            "id": action_id,
            "action_type": action_type,
            "description": description,
            "params": params,
            "timestamp": time.time(),
            "status": "pending"
        }
        return self.pending_confirmation

    def resolve_approval(self, action_id: str, approved: bool) -> bool:
        """Called when user clicks [ APPROVE ] or [ CANCEL ] in the desktop UI."""
        if self.pending_confirmation and self.pending_confirmation.get("id") == action_id:
            self.pending_confirmation["status"] = "approved" if approved else "rejected"
            self.log_event("APPROVAL_DECISION", {"action_id": action_id, "approved": approved})
            if approved:
                self.pending_confirmation = None
                return True
            else:
                self.pending_confirmation = None
                return False
        return False

    def log_event(self, event_type: str, details: Dict[str, Any]):
        """Maintains an append-only audit trail of operations."""
        entry = {
            "event": event_type,
            "details": details,
            "time": time.strftime("%H:%M:%S"),
            "timestamp": time.time()
        }
        self.audit_log.append(entry)
        if len(self.audit_log) > 500:
            self.audit_log.pop(0)
