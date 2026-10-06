"""The pre-refactor fixture is generated OpenAPI, never a hand-maintained API."""
import json
from pathlib import Path
from app.main import app


def test_contract_parity():
    before = json.loads((Path(__file__).parent / "contracts" / "openapi-v2.5.json").read_text(encoding="utf-8"))
    after = app.openapi()
    assert set(before["paths"]) == set(after["paths"])
    for path, methods in before["paths"].items():
        assert set(methods) == set(after["paths"][path])
        for method, old in methods.items():
            new = after["paths"][path][method]
            assert old.get("parameters", []) == new.get("parameters", [])
            assert old.get("requestBody") == new.get("requestBody")
            assert old.get("security") == new.get("security")
            for status, response in old["responses"].items():
                # Health now describes its unchanged {status: ok} body explicitly.
                if path == "/health":
                    continue
                assert response.get("content") == new["responses"][status].get("content")
    for name, schema in before["components"]["schemas"].items():
        assert schema == after["components"]["schemas"][name], name


def test_documentation_and_health(client):
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path).status_code == 200
    assert client.get("/health").json() == {"status": "ok"}
    for path, methods in app.openapi()["paths"].items():
        for operation in methods.values():
            assert operation.get("summary"), path
            assert len(operation.get("tags", [])) == 1, path
