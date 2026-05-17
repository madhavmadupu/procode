# Risk Analysis

## Technical Risks

### TR-01: Rust Native Module Complexity
**Risk:** Cross-platform Rust native modules are difficult to build and maintain  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Use NAPI-RS for stable ABI across Node.js versions
- Set up CI cross-compilation early
- Pre-compile .node binaries for all platforms
- Fallback to pure TypeScript implementations if native fails

### TR-02: Ollama Model Quality
**Risk:** Local models may not match cloud model quality  
**Likelihood:** High  
**Impact:** Medium  
**Mitigation:**
- Provide cloud adapter option for users who want best quality
- Continuously evaluate new open-source models
- Optimize prompts for local models
- Use hybrid approach: local for completions, cloud for complex tasks (opt-in)

### TR-03: Knowledge Graph Scale
**Risk:** Graph may become slow for very large codebases (1M+ files)  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- In-memory petgraph for hot queries, SurrealDB for persistence
- Subgraph extraction for focused queries
- Lazy loading of graph sections
- Benchmark and optimize at 100k, 500k, 1M file scales

### TR-04: Electron Performance
**Risk:** Electron app may feel sluggish compared to native IDEs  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Rust native modules for hot paths
- Lazy loading of packages
- Virtual rendering for large lists
- Performance budgets enforced in CI

### TR-05: LSP Server Compatibility
**Risk:** Some language servers may not work correctly  
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- Start with most popular language servers (TypeScript, Python, Rust)
- Test against official LSP specification
- Provide manual configuration fallback
- Community-driven language server support

## Business Risks

### BR-01: Market Competition
**Risk:** Established players (Cursor, VS Code) may copy features  
**Likelihood:** High  
**Impact:** High  
**Mitigation:**
- Move fast — ship features before competitors
- Open-source core — community contributions accelerate development
- Build moat with knowledge graph — hard to replicate
- Focus on local-first niche — competitors are cloud-dependent

### BR-02: Monetization
**Risk:** Free tier may be too generous, limiting revenue  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Team/enterprise features are collaboration-focused (natural upsell)
- Free tier drives adoption → network effects → team adoption
- Monitor conversion rates, adjust feature split if needed
- Multiple revenue streams (teams, enterprise, marketplace)

### BR-03: Funding
**Risk:** Development costs exceed revenue before profitability  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Lean development — small team, open-source contributions
- Phase rollout — build revenue-generating features first
- Seek funding if needed — strong narrative (local-first AI)
- Community support reduces development costs

### BR-04: Legal/Compliance
**Risk:** AI-generated code may have licensing issues  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Local models only — no training data concerns
- Clear disclosure when cloud models are used
- User responsibility for generated code
- Legal review of AI output policies

## Security Risks

### SR-01: Agent File Writes
**Risk:** AI agents may write malicious or destructive code  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- HITL approval for all file writes
- Diff viewer shows exact changes before approval
- Configurable trust levels per agent
- Audit log of all agent actions

### SR-02: Extension Security
**Risk:** Malicious extensions could compromise the IDE  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Sandboxed extension host (restricted API, no network access)
- Curated marketplace with review process
- User warnings for unverified extensions
- Process isolation (matches VS Code model)

### SR-03: Data Privacy
**Risk:** User code may leak to cloud providers  
**Likelihood:** Low  
**Impact:** Critical  
**Mitigation:**
- Local-first by default — zero network requests
- Explicit opt-in for cloud adapters
- Clear disclosure of what data is sent when cloud is enabled
- No telemetry without explicit consent

## Operational Risks

### OR-01: Developer Burnout
**Risk:** Small team building ambitious product may burn out  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Realistic roadmap — phased delivery over 12+ months
- Open-source community contributions
- Automate everything possible (CI/CD, testing)
- Sustainable pace — no crunch culture

### OR-02: Key Person Dependency
**Risk:** Project depends on specific individuals  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Comprehensive documentation
- Open-source — community can maintain if needed
- Cross-training — multiple people understand each subsystem
- Clear architecture — modular design reduces bus factor

## Risk Matrix

| Risk | Likelihood | Impact | Priority |
|------|-----------|--------|----------|
| TR-02: Ollama Model Quality | High | Medium | P0 |
| BR-01: Market Competition | High | High | P0 |
| TR-01: Rust Native Complexity | Medium | High | P1 |
| BR-02: Monetization | Medium | High | P1 |
| SR-01: Agent File Writes | Medium | High | P1 |
| SR-02: Extension Security | Medium | High | P1 |
| OR-01: Developer Burnout | Medium | High | P1 |
| TR-03: Knowledge Graph Scale | Low | Medium | P2 |
| TR-04: Electron Performance | Low | Medium | P2 |
| BR-03: Funding | Medium | High | P2 |
| TR-05: LSP Compatibility | Medium | Low | P2 |
| BR-04: Legal/Compliance | Low | High | P2 |
| SR-03: Data Privacy | Low | Critical | P2 |
| OR-02: Key Person Dependency | Medium | High | P2 |
