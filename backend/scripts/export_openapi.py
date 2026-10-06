"""Export the official schema from FastAPI; run from any working directory."""
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from app.main import app  # noqa: E402

if __name__ == "__main__":
    target = BACKEND / "docs" / "openapi.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"OpenAPI exported: {target.relative_to(BACKEND)}")
