# CI/CD Pipeline

## Overview

ProCode uses GitHub Actions for continuous integration and deployment. The pipeline runs on every PR and merge to main.

## Pipeline Stages

```
PR Created
    ↓
Lint & Typecheck
    ↓
Unit Tests (TS + Rust)
    ↓
Integration Tests
    ↓
Build (all platforms)
    ↓
E2E Tests (all platforms)
    ↓
Performance Benchmarks
    ↓
Merge to Main
    ↓
Release Build & Publish
```

## CI Configuration

### Main CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck

  test-typescript:
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: ./scripts/build-native.sh
      - run: pnpm test
      - name: Coverage
        run: pnpm coverage
      - name: Check coverage threshold
        run: pnpm coverage:check

  test-rust:
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test --workspace
      - run: cargo clippy -- -D warnings

  build:
    needs: [test-typescript, test-rust]
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: ./scripts/build-native.sh
      - run: pnpm build

  e2e:
    needs: build
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: ./scripts/build-native.sh
      - run: pnpm e2e

  benchmark:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: ./scripts/build-native.sh
      - run: pnpm benchmark
      - name: Compare to baseline
        run: pnpm benchmark:compare
```

### Rust Clippy Workflow
```yaml
# .github/workflows/rust-clippy.yml
name: Rust Clippy

on:
  pull_request:
    paths:
      - 'native/**'
      - 'Cargo.toml'
      - 'Cargo.lock'

jobs:
  clippy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - run: cargo clippy --workspace -- -D warnings
```

### Release Workflow
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: ./scripts/build-native.sh
      - run: pnpm build
      - name: Package
        run: |
          if [ "$RUNNER_OS" == "macOS" ]; then
            pnpm package:mac
          elif [ "$RUNNER_OS" == "Windows" ]; then
            pnpm package:win
          else
            pnpm package:linux
          fi
      - name: Upload to GitHub Releases
        uses: softprops/action-gh-release@v1
        with:
          files: |
            apps/desktop/dist/*.dmg
            apps/desktop/dist/*.exe
            apps/desktop/dist/*.AppImage
            apps/desktop/dist/*.deb
```

## Quality Gates

### Blocking Conditions
- Lint failures (ESLint, Prettier, Clippy)
- Type errors (TypeScript strict mode)
- Test failures (any platform)
- Coverage below threshold (70% for core packages)
- Performance regression > 10%
- E2E test failures (any platform)

### Non-Blocking Warnings
- Coverage below 80% (warning, not block)
- Bundle size increase > 5%
- New dependencies added

## Artifact Management

### Build Artifacts
- `.node` files — Native modules for each platform
- `dist/` — Compiled TypeScript output
- `coverage/` — Test coverage reports
- `benchmark-results.json` — Performance benchmark data

### Release Artifacts
- macOS: Universal DMG (arm64 + x64)
- Windows: NSIS installer (x64), portable executable
- Linux: AppImage (x64), Debian package (x64)

## Environment Variables

### CI Secrets
- `CODESIGN_CERT` — macOS code signing certificate
- `CODESIGN_KEY` — macOS code signing key
- `APPLE_ID` — Apple Developer account
- `APPLE_APP_SPECIFIC_PASSWORD` — Notarization password
- `WINDOWS_CERT` — Windows code signing certificate
- `GH_TOKEN` — GitHub token for releases

### Configuration
```yaml
env:
  NODE_ENV: production
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: procode
```
