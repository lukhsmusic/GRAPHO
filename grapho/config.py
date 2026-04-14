from pathlib import Path
import os

from dotenv import load_dotenv

load_dotenv()

VAULT_PATH = Path(os.getenv("VAULT_PATH", "./vault")).resolve()

if not VAULT_PATH.is_dir():
    raise RuntimeError(f"VAULT_PATH does not exist or is not a directory: {VAULT_PATH}")
