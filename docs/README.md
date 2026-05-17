# ProCode Documentation

## Overview

This directory contains all product, engineering, design, AI, infrastructure, business, and process documentation for ProCode IDE.

## Structure

```
docs/
├── product/          — Product requirements, user research, roadmap
├── engineering/      — Architecture, data models, APIs, testing
├── design/           — Design system, UI layout, components, themes
├── ai/               — RAG, agents, knowledge graph, models
├── infra/            — Build system, CI/CD, packaging, native modules
├── business/         — Go-to-market, competition, pricing, risks
├── process/          — Development workflow, code review, releases
├── adr/              — Architecture Decision Records
└── product_specifications/  — Original PRD (reference)
```

## Quick Links

### Product
- [User Personas](product/user-personas.md)
- [User Journeys](product/user-journeys.md)
- [Feature Requirements](product/feature-requirements.md)
- [Roadmap Phases](product/roadmap-phases.md)

### Engineering
- [System Architecture](engineering/system-architecture.md)
- [Monorepo Structure](engineering/monorepo-structure.md)
- [Data Models](engineering/data-models.md)
- [API Contracts](engineering/api-contracts.md)
- [Performance Budgets](engineering/performance-budgets.md)
- [Testing Strategy](engineering/testing-strategy.md)

### Design
- [Design System](design/design-system.md)
- [UI Layout](design/ui-layout.md)
- [Theme System](design/theme-system.md)
- [Component Library](design/component-library.md)

### AI
- [RAG Pipeline](ai/rag-pipeline.md)
- [Agent Orchestration](ai/agent-orchestration.md)
- [Knowledge Graph](ai/knowledge-graph.md)
- [Embedding Strategy](ai/embedding-strategy.md)
- [Model Strategy](ai/model-strategy.md)

### Infrastructure
- [Build System](infra/build-system.md)
- [CI/CD Pipeline](infra/ci-cd-pipeline.md)
- [Packaging & Distribution](infra/packaging-distribution.md)
- [Native Modules](infra/native-modules.md)

### Business
- [Go-to-Market](business/go-to-market.md)
- [Competitive Analysis](business/competitive-analysis.md)
- [Pricing Strategy](business/pricing-strategy.md)
- [Risk Analysis](business/risk-analysis.md)

### Process
- [Development Workflow](process/development-workflow.md)
- [Code Review Guidelines](process/code-review-guidelines.md)
- [Release Process](process/release-process.md)
- [Incident Response](process/incident-response.md)

### Architecture Decision Records
- [ADR-001](adr/001-use-electron.md) — Use Electron for cross-platform shell
- [ADR-002](adr/002-hybrid-typescript-rust.md) — Hybrid TypeScript + Rust architecture
- [ADR-003](adr/003-use-monaco-editor.md) — Use Monaco Editor as editor engine
- [ADR-004](adr/004-use-surrealdb.md) — Use SurrealDB for knowledge graph
- [ADR-005](adr/005-use-sqlite-workspace.md) — Use SQLite for workspace state
- [ADR-006](adr/006-custom-hnsw-rust.md) — Custom HNSW in Rust for vector search
- [ADR-007](adr/007-use-ollama.md) — Use Ollama for local AI inference
- [ADR-008](adr/008-use-napi-rs.md) — Use NAPI-RS for Rust ↔ Node.js bindings
- [ADR-009](adr/009-use-turborepo.md) — Use Turborepo for monorepo build orchestration
- [ADR-010](adr/010-use-zustand.md) — Use Zustand for state management
- [ADR-011](adr/011-local-first.md) — Local-first architecture
- [ADR-012](adr/012-multi-agent-orchestration.md) — Multi-agent orchestration with state machine
- [ADR-013](adr/013-vscode-extension-compatibility.md) — VS Code Extension API compatibility
- [ADR-014](adr/014-code-aware-chunking.md) — Code-aware chunking for RAG
- [ADR-015](adr/015-hybrid-search-rrf.md) — Hybrid search (Vector + BM25) with RRF
- [ADR-016](adr/016-hitl-agent-approval.md) — HITL approval for agent file writes
- [ADR-017](adr/017-process-isolation.md) — Process isolation security model
- [ADR-018](adr/018-use-trpc-ipc.md) — tRPC for type-safe IPC
- [ADR-019](adr/019-use-tree-sitter.md) — Tree-sitter for AST parsing
- [ADR-020](adr/020-react-vite-tailwind.md) — React 18 + Vite + Tailwind CSS for UI

## Reference

- [Original PRD](product_specifications/PRD.md) — Complete product specification and architecture document
