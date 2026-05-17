#!/usr/bin/env bash
set -euo pipefail

echo "=== Installing LSP servers ==="

echo "Installing TypeScript language server..."
npm install -g typescript-language-server typescript

echo "Installing Python language server..."
pip install pyright

echo "Installing Rust language server..."
rustup component add rust-analyzer

echo "=== LSP servers installed ==="
