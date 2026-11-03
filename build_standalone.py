"""Compatibility entry point; export now uses the shared React/TypeScript application."""
import subprocess
import sys
from pathlib import Path

subprocess.run(["npm", "run", "export", "--", *sys.argv[1:]], cwd=Path(__file__).resolve().parent, check=True)
