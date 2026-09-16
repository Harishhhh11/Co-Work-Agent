"""
Real Windows Filesystem Controller
Interacts with the user's actual Windows filesystem:
- Resolves known Windows folders: Downloads, Documents, Desktop, User Profile
- Search files by glob / extension (e.g. *.pdf in Downloads)
- Move, Copy, Rename, Create directory, Delete (guarded)
- Read and Write files
"""

import os
import glob
import shutil
from typing import List, Dict, Any, Optional

class WindowsFilesystemController:
    """Operations on the real Windows filesystem."""

    def __init__(self):
        self.user_profile = os.path.expanduser("~")
        self.downloads_path = os.path.join(self.user_profile, "Downloads")
        self.documents_path = os.path.join(self.user_profile, "Documents")
        self.desktop_path = os.path.join(self.user_profile, "Desktop")

    def resolve_path(self, path: str) -> str:
        """Expands environment variables and resolves common path aliases."""
        p = os.path.expandvars(path)
        p = os.path.expanduser(p)
        
        # Alias resolution
        lower = p.lower().strip()
        if lower == "downloads":
            return self.downloads_path
        elif lower == "documents":
            return self.documents_path
        elif lower == "desktop":
            return self.desktop_path
            
        return os.path.abspath(p)

    def list_files(self, folder: str, pattern: str = "*") -> List[Dict[str, Any]]:
        """Finds files in a directory matching pattern."""
        dir_path = self.resolve_path(folder)
        if not os.path.exists(dir_path):
            return []

        search_expr = os.path.join(dir_path, pattern)
        matches = glob.glob(search_expr)
        
        results = []
        for m in matches:
            stat = os.stat(m)
            results.append({
                "path": m,
                "name": os.path.basename(m),
                "is_dir": os.path.isdir(m),
                "size_bytes": stat.st_size,
                "modified": stat.st_mtime
            })
        return results

    def organize_files(self, source_folder: str, extension: str, destination_folder_name: str) -> Dict[str, Any]:
        """
        Example: Organize all PDFs in Downloads into a folder called Documents or PDFs.
        """
        src = self.resolve_path(source_folder)
        dest = os.path.join(src, destination_folder_name) if not os.path.isabs(destination_folder_name) else destination_folder_name
        dest = self.resolve_path(dest)

        os.makedirs(dest, exist_ok=True)
        
        ext_clean = extension if extension.startswith(".") else f".{extension}"
        moved = []
        
        for item in os.listdir(src):
            full_src = os.path.join(src, item)
            if os.path.isfile(full_src) and item.lower().endswith(ext_clean.lower()):
                full_dest = os.path.join(dest, item)
                shutil.move(full_src, full_dest)
                moved.append(item)

        return {
            "success": True,
            "moved_count": len(moved),
            "files": moved,
            "source": src,
            "destination": dest
        }

    def write_file(self, filepath: str, content: str) -> Dict[str, Any]:
        """Writes text to file."""
        target = self.resolve_path(filepath)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as f:
            f.write(content)
        return {"success": True, "path": target, "bytes_written": len(content)}

    def read_file(self, filepath: str, max_chars: int = 10000) -> Dict[str, Any]:
        """Reads content from file."""
        target = self.resolve_path(filepath)
        if not os.path.exists(target):
            return {"success": False, "error": f"File not found: {target}"}
        with open(target, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(max_chars)
        return {"success": True, "path": target, "content": content}
