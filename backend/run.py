"""Backend runner script.

Finds an available TCP port automatically and starts Uvicorn.
"""

from __future__ import annotations

import os
import socket
import sys
import subprocess

# Auto-use virtual environment if available and not already active
venv_python = os.path.join(os.path.dirname(__file__), "venv", "Scripts", "python.exe")
if os.path.exists(venv_python) and sys.executable != os.path.abspath(venv_python) and "VIRTUAL_ENV" not in os.environ:
    os.execv(venv_python, [venv_python] + sys.argv)

import uvicorn


def test_bind(host: str, port: int) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((host, port))
            return True
    except OSError:
        return False


def main() -> None:
    candidate_ports = [5000, 8000, 8080, 5050, 3000, 8001, 8081, 9090, 8888, 7000]
    selected_host = "127.0.0.1"
    selected_port = None

    for port in candidate_ports:
        if test_bind("127.0.0.1", port):
            selected_host = "127.0.0.1"
            selected_port = port
            break
        elif test_bind("localhost", port):
            selected_host = "localhost"
            selected_port = port
            break

    if not selected_port:
        # Fallback to dynamic port assignment by OS
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", 0))
                selected_port = s.getsockname()[1]
                selected_host = "127.0.0.1"
        except Exception:
            selected_port = 8080

    print(f"\n==================================================")
    print(f"  🚀 CampusX AI Backend starting on http://{selected_host}:{selected_port}")
    print(f"  📖 API Docs: http://{selected_host}:{selected_port}/api/docs")
    print(f"==================================================\n")

    # Write port for Vite proxy reference
    try:
        with open(".current_port", "w") as f:
            f.write(f"{selected_host}:{selected_port}")
    except Exception:
        pass

    uvicorn.run("app.main:app", host=selected_host, port=selected_port, reload=True)


if __name__ == "__main__":
    main()
