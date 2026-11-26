#!/usr/bin/env bash
set -euo pipefail

server_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$server_dir/.env" ]]; then
  printf 'Missing %s/.env. Copy .env.example to .env and fill in the GlitchTip credentials.\n' "$server_dir" >&2
  exit 1
fi

cd "$server_dir"
exec node --env-file="$server_dir/.env" --import tsx "$server_dir/src/index.ts"
