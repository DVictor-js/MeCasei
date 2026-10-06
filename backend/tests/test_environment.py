from types import SimpleNamespace
import secrets
import pytest
from pydantic import ValidationError
from sqlalchemy.engine import make_url
from app.core.config import Settings
from scripts import start as startup

DB = "postgresql+psycopg://test:fake-password@localhost:5433/mecasei"
KEY = secrets.token_urlsafe(48)


@pytest.fixture(autouse=True)
def isolated_environment(monkeypatch):
    for key in ("APP_ENV", "ENVIRONMENT", "DATABASE_HOST", "DATABASE_PORT", "CORS_ALLOWED_ORIGINS", "CORS_ORIGINS", "PORT", "JWT_SECRET_KEY", "DATABASE_URL"):
        monkeypatch.delenv(key, raising=False)


def configured(**overrides):
    return Settings(_env_file=None, **{"database_url": DB, "jwt_secret_key": KEY, **overrides})


@pytest.mark.parametrize("key", ["", "CHANGE_ME", "x" * 31, " " * 40, "replace-with-a-long-random-secret-at-least-32-characters"])
def test_insecure_jwt_is_rejected_without_exposing_secrets(key):
    with pytest.raises(ValidationError) as failure:
        configured(jwt_secret_key=key)
    assert "JWT_SECRET_KEY must be configured" in str(failure.value)
    assert "fake-password" not in str(failure.value)


def test_environment_aliases_cors_and_host_override(monkeypatch):
    dev = configured()
    assert dev.app_env == "development" and dev.port == 8000
    assert dev.origins == ["http://localhost:8081"]
    demo = configured(app_env="demo", port=8123)
    assert demo.origins == []
    assert KEY not in repr(demo) and "fake-password" not in repr(demo)
    monkeypatch.setenv("ENVIRONMENT", "demo")
    monkeypatch.setenv("CORS_ORIGINS", "https://preview.example.com")
    legacy = configured()
    assert legacy.app_env == "demo" and legacy.origins == ["https://preview.example.com"]
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "")
    assert configured().origins == []
    local = configured(database_host="postgres", database_port=5432)
    assert make_url(local.database_url).host == "postgres"


@pytest.mark.parametrize("url", ["postgres://test:fake-password@postgres.internal:5432/mecasei?sslmode=require", "postgresql://test:fake-password@postgres.internal:5432/mecasei?sslmode=require"])
def test_hosted_url_uses_psycopg_without_losing_query_or_host(url):
    resolved = make_url(configured(database_url=url).database_url)
    assert resolved.drivername == "postgresql+psycopg"
    assert resolved.host == "postgres.internal"
    assert resolved.query == {"sslmode": "require"}
    assert resolved.password == "fake-password"


def test_invalid_port_and_wildcard_are_rejected():
    for value in (0, 65536):
        with pytest.raises(ValidationError):
            configured(port=value)
    for mode in ("development", "demo"):
        with pytest.raises(ValidationError, match="wildcard"):
            configured(app_env=mode, cors_allowed_origins="*")


def test_migration_failure_prevents_uvicorn(monkeypatch):
    monkeypatch.setattr(startup, "get_settings", lambda: configured())
    monkeypatch.setattr(startup.subprocess, "run", lambda *args, **kwargs: SimpleNamespace(returncode=7))
    def unexpected(*args):
        pytest.fail("API started after a failed migration")
    monkeypatch.setattr(startup.os, "execv", unexpected)
    assert startup.start() == 7


def test_demo_starts_after_migration_on_platform_port(monkeypatch, tmp_path):
    calls = []
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(startup, "get_settings", lambda: configured(app_env="demo", port=8123))
    def migration(command, **kwargs):
        calls.append(command)
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(startup.subprocess, "run", migration)
    monkeypatch.setattr(startup.os, "execv", lambda executable, command: calls.append(command))
    assert startup.start() == 0
    assert calls[0][-2:] == ["upgrade", "head"]
    assert calls[1][-2:] == ["--port", "8123"]
    assert "--reload" not in calls[1]
