# Build System

## Overview

ProCode uses a dual build system: Turborepo for TypeScript packages and Cargo workspaces for Rust native modules.

## TypeScript Build (Turborepo)

### Root Configuration
```json
// package.json
{
  "name": "procode",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

### Pipeline Configuration
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.node"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Package Build Order
```
types → utils → db → editor-core → git-engine → lsp-host → dap-host
                                              ↓
                     knowledge-graph → rag-pipeline → agent-orchestration
                                              ↓
                                    llm-client → extension-api → terminal
                                              ↓
                                        desktop (app)
```

## Rust Build (Cargo Workspace)

### Workspace Configuration
```toml
# native/Cargo.toml
[workspace]
members = [
    "procode-native",
    "procode-graph",
    "procode-vector",
    "procode-git",
]
resolver = "2"

[workspace.dependencies]
napi = { version = "2.16", features = ["napi6"] }
napi-derive = "2.16"
petgraph = "0.6"
tree-sitter = "0.22"
notify = "6.1"
libgit2-sys = "0.16"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
thiserror = "1.0"
```

### Build Commands
```bash
# Build all Rust crates
cargo build --workspace

# Build with optimizations
cargo build --workspace --release

# Build NAPI bindings
cd native/procode-native && napi build

# Cross-compile for other platforms
cross build --target x86_64-unknown-linux-gnu
cross build --target aarch64-apple-darwin
cross build --target x86_64-pc-windows-msvc
```

## Native Module Build

### NAPI-RS Build Script
```bash
#!/bin/bash
# scripts/build-native.sh

echo "Building Rust native modules..."

# Build for current platform
cd native/procode-native
napi build --platform --release

# Copy .node files to desktop app
cp *.node ../../apps/desktop/native/

echo "Native modules built successfully."
```

### Cross-Platform Compilation
```yaml
# .github/workflows/rust-build.yml
jobs:
  build-native:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - os: windows-latest
            target: x86_64-pc-windows-msvc
    steps:
      - uses: actions/checkout@v4
      - uses: goto-bus-stop/setup-zig@v2
      - run: cargo install cross-rs
      - run: cross build --target ${{ matrix.target }} --release
      - uses: actions/upload-artifact@v4
        with:
          name: native-${{ matrix.target }}
          path: native/**/*.node
```

## Development Server

### Electron + Vite HMR
```typescript
// apps/desktop/electron.vite.config.ts
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@procode/types': '../../packages/types/src',
        '@procode/utils': '../../packages/utils/src',
      },
    },
  },
});
```

### Dev Workflow
```bash
# Start everything
pnpm dev

# This runs:
# 1. Vite HMR for renderer (React)
# 2. TypeScript watch for main process
# 3. Electron app with hot reload
```

## Production Build

### Full Build Pipeline
```bash
# 1. Install dependencies
pnpm install

# 2. Build Rust native modules
./scripts/build-native.sh

# 3. Build all TypeScript packages
pnpm build

# 4. Package Electron app
./scripts/package-app.sh
```

### Package Scripts
```json
{
  "scripts": {
    "package:mac": "electron-builder --mac --universal",
    "package:win": "electron-builder --win --x64",
    "package:linux": "electron-builder --linux --x64",
    "package:all": "electron-builder --mac --win --linux"
  }
}
```

## Build Performance

### Caching Strategy
- **Turborepo remote cache** — Share build cache across team/CI
- **Cargo target directory** — Cache Rust compilation artifacts
- **Node modules** — pnpm store for fast installs
- **Ollama models** — Cache downloaded models locally

### Optimization
- Incremental builds — only rebuild changed packages
- Parallel compilation — Rust crates build in parallel
- Lazy loading — defer non-critical package initialization
- Pre-compiled natives — ship .node files, don't build on install
