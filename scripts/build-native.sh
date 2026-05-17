#!/usr/bin/env bash
set -euo pipefail

echo "=== Building Rust native modules ==="

cd "$(dirname "$0")/.."

cargo build --release

echo "=== Copying .node files ==="

mkdir -p apps/desktop/native

if [ -f target/release/procode_native.dll ]; then
    cp target/release/procode_native.dll apps/desktop/native/
elif [ -f target/release/libprocode_native.dylib ]; then
    cp target/release/libprocode_native.dylib apps/desktop/native/
elif [ -f target/release/libprocode_native.so ]; then
    cp target/release/libprocode_native.so apps/desktop/native/
fi

echo "=== Native modules built successfully ==="
