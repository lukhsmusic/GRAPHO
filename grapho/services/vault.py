from pathlib import Path
import os
import tempfile

from grapho.config import VAULT_PATH


def _safe_path(relative: str) -> Path:
    """Resolve a relative path within the vault and guard against traversal."""
    resolved = (VAULT_PATH / relative).resolve()
    if not str(resolved).startswith(str(VAULT_PATH)):
        raise PermissionError("Path traversal detected")
    return resolved


def list_tree(subpath: str = "") -> list[dict]:
    """Return a nested tree structure of the vault directory."""
    root = _safe_path(subpath)
    if not root.is_dir():
        return []

    entries = sorted(root.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
    tree = []
    for entry in entries:
        if entry.name.startswith("."):
            continue
        rel = str(entry.relative_to(VAULT_PATH))
        if entry.is_dir():
            tree.append({
                "name": entry.name,
                "path": rel,
                "type": "dir",
                "children": list_tree(rel),
            })
        elif entry.suffix == ".md":
            tree.append({
                "name": entry.name,
                "path": rel,
                "type": "file",
            })
    return tree


def read_file(relative: str) -> str:
    """Read a markdown file and return its content."""
    path = _safe_path(relative)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {relative}")
    return path.read_text(encoding="utf-8")


def write_file(relative: str, content: str) -> None:
    """Write content to a file atomically."""
    path = _safe_path(relative)
    if not path.parent.is_dir():
        raise FileNotFoundError(f"Parent directory does not exist: {relative}")

    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
        os.replace(tmp_path, path)
    except Exception:
        os.unlink(tmp_path)
        raise


def create_file(relative: str) -> None:
    """Create a new empty markdown file."""
    path = _safe_path(relative)
    if path.exists():
        raise FileExistsError(f"File already exists: {relative}")
    if not path.parent.is_dir():
        raise FileNotFoundError(f"Parent directory does not exist: {relative}")
    path.write_text("", encoding="utf-8")


def create_dir(relative: str) -> None:
    """Create a new directory."""
    path = _safe_path(relative)
    if path.exists():
        raise FileExistsError(f"Directory already exists: {relative}")
    path.mkdir(parents=False, exist_ok=False)


def delete_file(relative: str) -> None:
    """Delete a file."""
    path = _safe_path(relative)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {relative}")
    path.unlink()
