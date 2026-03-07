"""
Vercel ASGI entrypoint for Devise Dashboard backend.
Vercel requires the FastAPI app to be importable as `app` from api/index.py.
"""

import sys
import os

# Make the backend package importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.server import app  # noqa: F401 — Vercel picks up `app`
