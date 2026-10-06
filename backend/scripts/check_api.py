"""Read-only smoke check of a local or hosted MeCasei API. No dependencies needed."""
import argparse
import json
import sys
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import urlopen


def check(base_url: str) -> bool:
    base_url = base_url.rstrip("/")
    parsed = urlsplit(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.query or parsed.fragment:
        print("Use a BASE_URL HTTP(S) sem credenciais, query ou fragmento.")
        return False
    healthy = True
    for path in ("/health", "/docs", "/redoc", "/openapi.json"):
        try:
            with urlopen(base_url + path, timeout=10) as response:
                valid = response.status == 200
                if path == "/health":
                    valid = valid and json.load(response) == {"status": "ok"}
                elif path == "/openapi.json":
                    schema = json.load(response)
                    valid = valid and "openapi" in schema and "/api/v1/auth/login" in schema.get("paths", {})
            print(f"{path}: {'OK' if valid else 'resposta inesperada'}")
        except (URLError, TimeoutError, ValueError):
            valid = False
            print(f"{path}: indisponível")
        healthy = healthy and valid
    return healthy


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url", help="Ex.: http://localhost:8000 ou a URL HTTPS real da demo")
    args = parser.parse_args()
    sys.exit(0 if check(args.base_url) else 1)
