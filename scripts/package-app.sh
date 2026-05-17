#!/usr/bin/env bash
set -euo pipefail

echo "=== Packaging ProCode for distribution ==="

cd "$(dirname "$0")/.."

pnpm build

npx electron-builder --config apps/desktop/electron-builder.yml

echo "=== Package complete ==="
