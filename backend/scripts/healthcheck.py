"""Small stdlib-only health check, usable on host or in the API container."""
import argparse
import json
import sys
from urllib.error import URLError
from urllib.request import urlopen

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000/health")
    args = parser.parse_args()
    try:
        with urlopen(args.url, timeout=5) as response:
            healthy = response.status == 200 and json.load(response) == {"status": "ok"}
    except (URLError, TimeoutError, ValueError):
        healthy = False
    print("Backend funcionando (API + PostgreSQL)." if healthy else "Backend indisponível; confira Docker e logs da API.")
    sys.exit(0 if healthy else 1)
