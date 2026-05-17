# Model Strategy

## Overview

ProCode uses a local-first AI model strategy with Ollama as the default inference engine, with optional cloud adapters for users who need higher-quality models.

## Local Models (Default)

### Code Generation
| Task | Model | Size | Notes |
|------|-------|------|-------|
| Code completion | DeepSeek-Coder-V2 | 16B | Best open-source code model |
| Chat/analysis | Qwen2.5-Coder | 7B | Good balance of quality/speed |
| Lightweight | StarCoder2 | 3B | Faster, lower quality |

### Embeddings
| Task | Model | Dimensions | Notes |
|------|-------|-----------|-------|
| Code embeddings | nomic-embed-text | 768 | Default, excellent for code |
| Alternative | all-MiniLM-L6-v2 | 384 | Smaller, faster |

### Reranking
| Task | Model | Runtime | Notes |
|------|-------|---------|-------|
| Cross-encoder rerank | ms-marco-MiniLM-L6-v2 | ONNX | CPU-only, fast |

## Cloud Models (Optional)

Users can opt-in to cloud providers per workspace:

### Anthropic
- **Model:** Claude 3.5 Sonnet
- **Use case:** Complex reasoning, architecture tasks
- **Privacy:** Only assembled context sent, not full codebase

### OpenAI
- **Model:** GPT-4o
- **Use case:** Code generation, chat
- **Privacy:** Same as Anthropic

### Configuration
```typescript
interface AIConfig {
  provider: 'ollama' | 'anthropic' | 'openai';
  model: string;
  ollama?: {
    baseUrl: string;  // default: http://localhost:11434
    model: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;  // default: claude-sonnet-4-20250514
  };
  openai?: {
    apiKey: string;
    model: string;  // default: gpt-4o
  };
}
```

## Model Selection Logic

### Automatic Selection
ProCode selects the best model based on task type:

| Task Type | Local Model | Cloud Model (if enabled) |
|-----------|-------------|--------------------------|
| Inline completion | DeepSeek-Coder-V2 | Claude 3.5 Sonnet |
| Chat | Qwen2.5-Coder | Claude 3.5 Sonnet |
| Embedding | nomic-embed-text | nomic-embed-text (local) |
| Reranking | ms-marco-MiniLM | ms-marco-MiniLM (local) |
| Agent tasks | Qwen2.5-Coder | Claude 3.5 Sonnet |

### Hardware-Aware Selection
ProCode detects available hardware and adjusts:

| Hardware | Recommended Model |
|----------|-------------------|
| 8GB RAM, no GPU | StarCoder2 (3B) |
| 16GB RAM, no GPU | Qwen2.5-Coder (7B) |
| 32GB RAM, no GPU | DeepSeek-Coder-V2 (16B) |
| Any RAM, Apple Silicon | DeepSeek-Coder-V2 (16B, MLX) |
| Any RAM, NVIDIA GPU | DeepSeek-Coder-V2 (16B, CUDA) |

## Model Management

### Ollama Integration
```typescript
class OllamaManager {
  async checkStatus(): Promise<OllamaStatus> { ... }

  async installModel(model: string): Promise<void> { ... }

  async listModels(): Promise<string[]> { ... }

  async pullModel(model: string, onProgress: Callback): Promise<void> { ... }

  async deleteModel(model: string): Promise<void> { ... }
}
```

### First-Run Setup
1. Check if Ollama is installed
2. If not, offer guided installation
3. Check available disk space and RAM
4. Recommend appropriate model based on hardware
5. Download recommended model in background
6. Show progress indicator in status bar

### Model Updates
- Check for model updates on workspace open
- Notify user when better model versions available
- Never auto-update models without user consent
- Keep previous model version until new one downloads

## Performance Targets

| Operation | Local Target | Cloud Target |
|-----------|-------------|--------------|
| Inline completion | < 300ms | < 500ms (network) |
| Chat response (first token) | < 2s | < 1s |
| Chat response (complete) | < 10s | < 5s |
| Embedding (single) | < 50ms | N/A (local only) |

## Cost Considerations

### Local (Default)
- **Cost:** $0 — all inference on user's hardware
- **Trade-off:** Model quality limited by local hardware

### Cloud (Optional)
- **Cost:** User's API key — billed by provider
- **Transparency:** Show estimated cost per request
- **Limits:** User-configurable monthly spend cap
- **Disclosure:** Clear indication when cloud is active
