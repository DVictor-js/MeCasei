"""One runtime entry point for local Docker and hosted demo: Alembic then Uvicorn."""
import argparse
import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from app.core.config import get_settings  # noqa: E402


def start(reload: bool = False) -> int:
    settings = get_settings()
    if reload and settings.app_env != "development":
        raise ValueError("--reload is available only with APP_ENV=development.")
    migration = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", str(BACKEND / "alembic.ini"), "upgrade", "head"],
        cwd=BACKEND, check=False,
    )
    if migration.returncode:
        print("Migration failed. API was not started.", file=sys.stderr)
        return migration.returncode
    command = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", str(settings.port)]
    if reload:
        command.append("--reload")
    os.chdir(BACKEND)
    os.execv(sys.executable, command)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reload", action="store_true", help="Development only.")
    args = parser.parse_args()
    try:
        sys.exit(start(args.reload))
    except ValueError as error:
        print(str(error), file=sys.stderr)
        sys.exit(2)
