#!/usr/bin/env bash
set -euo pipefail

echo "=== Setting up ProCode development environment ==="

cd "$(dirname "$0")/.."

echo "1. Installing Node.js dependencies..."
pnpm install

echo "2. Building Rust native modules..."
./scripts/build-native.sh

echo "3. Building TypeScript packages..."
pnpm build

echo "=== Setup complete ==="
echo "Run 'pnpm dev' to start the development server."
