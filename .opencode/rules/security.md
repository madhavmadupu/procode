# Rule: Security

## Input Validation

- NEVER trust input from the renderer process without Zod validation in the IPC handler.
- All IPC inputs must be validated with Zod schemas before any operation.

## Command Execution

- NEVER interpolate user input into shell commands. Use argument arrays, never shell strings.
- NEVER eval() or new Function() with user-controlled strings.

## Error Exposure

- NEVER expose internal paths, stack traces, or system info in error messages sent to the renderer.
- Internal errors should be logged but not surfaced to the UI with full details.

## Agent Security

- All agent file write operations go through HITL (Human-in-the-Loop) approval gate.
- Agent terminal commands are shown to user before execution.
- Configurable allow-list of safe commands; dangerous commands (`rm -rf`, `sudo`) require additional confirmation.

## Data Privacy

- All AI inference runs locally via Ollama by default. Zero network requests to AI providers.
- Optional cloud adapters (Anthropic, OpenAI) require explicit user opt-in per workspace.
- Telemetry is opt-in, anonymized, and limited to crash reports.
