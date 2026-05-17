# ADR-012: Multi-Agent Orchestration with LangGraph-Style State Machine

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Agent System Architecture

## Decision

Implement multi-agent orchestration as a stateful graph (LangGraph-inspired) where agents are specialized nodes and the orchestrator routes tasks based on intent classification.

## Rationale

- Graph-based orchestration naturally models complex multi-step workflows
- Intent classifier routes tasks to the most appropriate specialized agent
- State machine provides clear, debuggable execution flow
- Supports parallel agent execution when tasks are independent
- Human-in-the-loop gates can be inserted at any point in the graph
- Inspired by proven patterns from LangGraph, AutoGen, and CrewAI

## Alternatives Considered

- **Single monolithic agent** — Simpler but less capable, harder to debug, no specialization
- **Sequential pipeline** — Easy to understand but inflexible, no parallelism
- **ReAct loop** — Good for single agent but doesn't scale to multi-agent collaboration
- **Custom orchestration** — Full control but reinventing proven patterns

## Consequences

- **Pros:** Flexible, debuggable, supports specialization and parallelism, HITL integration
- **Cons:** Complex to implement correctly, state management overhead
- **Mitigation:** Start with simple graph (3 agents), expand as system stabilizes; comprehensive logging for debugging
