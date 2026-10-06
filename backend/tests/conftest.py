import os
import sys
from pathlib import Path
import secrets
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import make_url

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
env_file = ROOT / ".env"
env_values = dict(line.split("=", 1) for line in env_file.read_text().splitlines() if "=" in line and not line.startswith("#")) if env_file.exists() else {}
dev_url = make_url(os.environ.get("DATABASE_URL") or env_values["DATABASE_URL"])
if dev_url.database != "mecasei":
    raise RuntimeError("Testes precisam usar banco isolado mecasei_test")
os.environ["DATABASE_URL"] = dev_url.set(database="mecasei_test").render_as_string(hide_password=False)
os.environ["JWT_SECRET_KEY"] = secrets.token_urlsafe(48)

from app.main import app  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.db.base import Base  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def migrated():
    command.upgrade(Config(str(ROOT / "alembic.ini")), "head")


@pytest.fixture(autouse=True)
def empty_database(migrated):
    tables = ", ".join(f'"{table.name}"' for table in Base.metadata.sorted_tables)
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {tables} CASCADE"))


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def register(client, name="Alex", email="alex@example.com", password="mecasei-2026"):
    response = client.post("/api/v1/auth/register", json={"name": name, "email": email, "password": password})
    assert response.status_code == 201, response.text
    return response.json()


def headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def wedding(client, tokens):
    response = client.post("/api/v1/weddings", headers=headers(tokens), json={
        "partner_one_name": "Alex", "partner_two_name": "Dani",
        "wedding_date": "2027-05-22", "city": "São Paulo",
        "guest_target": 120, "budget_target_cents": 6000000,
        "onboarding_completed": True,
    })
    assert response.status_code == 201, response.text
    return response.json()
