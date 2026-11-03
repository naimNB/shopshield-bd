"""Vercel Serverless Function entry point when Root Directory is set to backend.

Ensures Python module resolution resolves `backend.app.*` from the repository root.
"""

import sys
from pathlib import Path

# When Vercel executes with Root Directory = backend, the repository root is 2 levels up
backend_dir = Path(__file__).resolve().parent.parent
repo_root = backend_dir.parent

for path in [str(repo_root), str(backend_dir)]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import the existing production FastAPI app
from backend.app.main import app

__all__ = ["app"]
