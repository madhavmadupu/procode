# ADR-007: Use Ollama for Local AI Inference

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — AI Inference Engine

## Decision

Use Ollama as the default local AI inference engine, with optional cloud adapters (Anthropic, OpenAI) for users who opt-in.

## Rationale

- Ollama provides a simple, local-first LLM serving layer
- Supports wide range of open-source models (CodeLlama, DeepSeek, Qwen, etc.)
- Built-in embedding model support (nomic-embed-text)
- Simple REST API, easy to integrate
- Automatic model downloads and management
- Zero code leaves the machine by default — aligns with local-first philosophy

## Alternatives Considered

- **llama.cpp directly** — More control but requires manual model management and API wrapping
- **vLLM** — Excellent for GPU servers but overkill for local desktop
- **Cloud-only (OpenAI/Anthropic)** — Better models but violates local-first principle, privacy concerns
- **MLX (Apple Silicon)** — Great for Mac but not cross-platform

## Consequences

- **Pros:** Local-first, privacy-preserving, wide model support, simple integration
- **Cons:** Model quality may lag behind cloud providers, requires user to download models
- **Mitigation:** Optional cloud adapters for users who want best-in-class models, clear disclosure when cloud is enabled
