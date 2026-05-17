# Monorepo Structure

## Overview

ProCode uses a Turborepo + Cargo workspace monorepo structure with TypeScript packages and Rust native modules.

## Directory Tree

```
procode/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Build, test, lint on every PR
│   │   ├── release.yml               # Electron packaging + GitHub release
│   │   └── rust-clippy.yml           # Rust linting
│   └── CODEOWNERS
│
├── .gitignore
├── turbo.json                        # Turborepo pipeline config
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml
├── Cargo.toml                        # Rust workspace root
├── Cargo.lock
├── tsconfig.base.json
│
├── apps/
│   └── desktop/                      # Electron application
│       ├── src/
│       │   ├── main/                 # Main process (Node.js)
│       │   │   ├── index.ts          # App entry, window management
│       │   │   ├── ipc/              # IPC handler registry
│       │   │   │   ├── editor.ipc.ts
│       │   │   │   ├── git.ipc.ts
│       │   │   │   ├── agent.ipc.ts
│       │   │   │   └── graph.ipc.ts
│       │   │   ├── services/         # Main-process services
│       │   │   │   ├── WindowManager.ts
│       │   │   │   ├── WorkspaceManager.ts
│       │   │   │   ├── OllamaManager.ts
│       │   │   │   └── UpdateManager.ts
│       │   │   └── preload/
│       │   │       └── index.ts      # Context bridge
│       │   │
│       │   └── renderer/             # Renderer process (React)
│       │       ├── index.html
│       │       ├── main.tsx
│       │       ├── App.tsx
│       │       ├── components/
│       │       │   ├── editor/
│       │       │   ├── sidebar/
│       │       │   ├── panels/
│       │       │   ├── chat/
│       │       │   └── shared/
│       │       ├── hooks/
│       │       ├── stores/           # Zustand stores
│       │       └── styles/
│       ├── electron.vite.config.ts
│       └── package.json
│
├── packages/
│   ├── editor-core/                  # Editor state management (shared)
│   ├── git-engine/                   # Git operations (TypeScript layer)
│   ├── lsp-host/                     # LSP client host
│   ├── dap-host/                     # Debug Adapter Protocol host
│   ├── knowledge-graph/              # Knowledge graph TypeScript API
│   ├── rag-pipeline/                 # RAG system
│   ├── agent-orchestration/          # Multi-agent system
│   ├── llm-client/                   # Unified LLM interface
│   ├── extension-api/                # Extension host + API surface
│   ├── terminal/                     # PTY terminal backend
│   ├── db/                           # Database access layer
│   ├── types/                        # Shared TypeScript types
│   └── utils/                        # Shared utilities
│
├── native/                           # Rust workspace
│   ├── Cargo.toml                    # Rust workspace manifest
│   ├── procode-native/               # Main NAPI-RS binding crate
│   ├── procode-graph/                # Knowledge graph engine
│   ├── procode-vector/               # HNSW vector index
│   └── procode-git/                  # libgit2 bindings (fast git ops)
│
├── scripts/
│   ├── build-native.sh               # Compile Rust → .node files
│   ├── setup-dev.sh                  # Full dev environment setup
│   ├── package-app.sh                # Electron builder
│   └── install-lsp-servers.sh        # Auto-install common LSP servers
│
├── docs/
│   ├── product/
│   ├── engineering/
│   ├── design/
│   ├── ai/
│   ├── infra/
│   ├── business/
│   ├── process/
│   └── adr/
│
└── tests/
    ├── e2e/                          # Playwright E2E tests
    ├── integration/                  # Cross-package integration tests
    └── fixtures/                     # Test workspaces / repos
```

## Package Dependencies

```
apps/desktop
├── packages/editor-core
├── packages/git-engine
├── packages/lsp-host
├── packages/dap-host
├── packages/knowledge-graph
├── packages/rag-pipeline
├── packages/agent-orchestration
├── packages/llm-client
├── packages/extension-api
├── packages/terminal
├── packages/db
├── packages/types
├── packages/utils
└── native/procode-native (NAPI-RS)

packages/knowledge-graph
├── packages/db
├── packages/types
├── packages/utils
└── native/procode-graph (NAPI-RS)

packages/rag-pipeline
├── packages/knowledge-graph
├── packages/llm-client
├── packages/db
├── packages/types
├── packages/utils
└── native/procode-vector (NAPI-RS)

packages/agent-orchestration
├── packages/rag-pipeline
├── packages/knowledge-graph
├── packages/llm-client
├── packages/git-engine
├── packages/types
└── packages/utils
```

## Build Pipeline

### Turborepo (TypeScript)
```json
{
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
    "lint": {}
  }
}
```

### Cargo Workspace (Rust)
```toml
[workspace]
members = [
    "native/procode-native",
    "native/procode-graph",
    "native/procode-vector",
    "native/procode-git",
]
resolver = "2"
```

## Development Workflow

```bash
# One-time setup
pnpm install
./scripts/build-native.sh        # Compile Rust modules
./scripts/setup-dev.sh           # Install LSP servers, Ollama models

# Start dev server (Electron + Vite HMR)
pnpm dev

# Run tests
pnpm test                        # Unit + integration
pnpm e2e                         # Playwright E2E
cargo test --workspace           # Rust tests

# Build for production
pnpm build
./scripts/package-app.sh         # Electron builder
```
