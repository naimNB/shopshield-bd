"""Vercel Serverless Function entry point for ShopShield BD FastAPI backend.

This file provides the official Vercel serverless adapter entry point while
preserving standard Python module resolution for `backend.app.*` from the
repository root.
"""

import sys
from pathlib import Path

# Ensure the repository root and backend directory are on sys.path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

backend_dir = repo_root / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import the existing production FastAPI app
from backend.app.main import app

# Expose app for Vercel ASGI runtime
__all__ = ["app"]
