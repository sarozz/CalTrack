#!/usr/bin/env bash
set -euo pipefail

# Load .env into the current shell, then run the given command.
# Usage: ./load-env.sh npx expo start --tunnel --port 8084

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
else
  echo "Missing .env. Create one from .env.example" >&2
  exit 1
fi

exec "$@"
