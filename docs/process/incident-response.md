# Incident Response

## Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 — Critical** | Data loss, security breach, app won't start | 1 hour | Code deletion, credential leak |
| **P1 — High** | Core feature broken, significant data corruption | 4 hours | Git operations broken, LSP crash loop |
| **P2 — Medium** | Feature degraded, workaround available | 24 hours | AI chat slow, graph visualization broken |
| **P3 — Low** | Minor bug, cosmetic issue | 1 week | UI misalignment, typo in settings |

## Incident Response Process

### 1. Detection
- **Automated:** Crash reports, error monitoring, CI failures
- **Manual:** User reports (GitHub Issues, Discord, email)
- **Monitoring:** Performance metrics, error rate dashboards

### 2. Triage
- Assess severity based on impact and scope
- Assign incident owner
- Create incident tracking issue
- Notify relevant team members

### 3. Investigation
- Reproduce the issue
- Identify root cause
- Assess scope (how many users affected)
- Determine if rollback is needed

### 4. Resolution
- **Immediate:** Rollback if critical, hotfix for high severity
- **Short-term:** Patch release with fix
- **Long-term:** Architectural fix to prevent recurrence

### 5. Communication
- **Internal:** Slack/Discord incident channel
- **External:** GitHub Issues, status page, social media
- **Post-mortem:** Public write-up for P0/P1 incidents

### 6. Post-Mortem
- Document timeline of events
- Identify root cause
- List action items to prevent recurrence
- Publish post-mortem (for P0/P1)

## Crash Reporting

### Opt-In Telemetry
```typescript
interface CrashReport {
  version: string;
  platform: 'macos' | 'windows' | 'linux';
  architecture: 'arm64' | 'x64';
  error: {
    message: string;
    stack: string;
    process: 'main' | 'renderer';
  };
  context: {
    workspaceSize?: number;
    activeFeatures?: string[];
    memoryUsage?: number;
  };
  timestamp: number;
}
```

### Crash Report Handling
1. Crash captured locally
2. User prompted to send report (opt-in)
3. Report sent to error tracking service
4. Aggregated and analyzed for patterns
5. Critical crashes trigger alerts

## Common Incident Scenarios

### SC-01: App Won't Start
**Symptoms:** App crashes on launch, white screen  
**Response:**
1. Check crash logs for error message
2. Identify if it's a specific platform or universal
3. If universal: rollback to previous version
4. If platform-specific: investigate native module issue
5. Release hotfix within 4 hours

### SC-02: Data Corruption
**Symptoms:** Workspace state corrupted, files lost  
**Response:**
1. Immediately stop writes to affected workspace
2. Check if backup exists (SQLite WAL files)
3. Provide recovery instructions to users
4. Identify root cause (concurrent writes, disk full, etc.)
5. Release fix with data integrity checks

### SC-03: Security Vulnerability
**Symptoms:** Reported vulnerability, potential exploit  
**Response:**
1. Verify vulnerability
2. Assess scope and severity
3. If critical: silent fix, coordinated disclosure
4. Release patch without public announcement
5. Notify affected users privately
6. Publish advisory after patch is available

### SC-04: AI Agent Misbehavior
**Symptoms:** Agent writes incorrect code, infinite loops  
**Response:**
1. Kill running agent tasks
2. Review agent logs for root cause
3. If systematic: disable affected agent type
4. Fix orchestration logic
5. Re-enable with additional safeguards

### SC-05: Performance Degradation
**Symptoms:** App becomes slow, high memory usage  
**Response:**
1. Profile the application (Chrome DevTools, Node.js --inspect)
2. Identify the subsystem causing degradation
3. If memory leak: restart affected process
4. If CPU bound: throttle background operations
5. Release fix with performance regression tests

## Communication Templates

### Incident Acknowledgment
```
We're aware of an issue affecting [feature]. Our team is investigating.
We'll provide an update within [timeframe].

Impact: [description]
Workaround: [if available]
```

### Incident Resolution
```
The issue affecting [feature] has been resolved in version [x.y.z].
Please update to the latest version.

Root cause: [brief description]
Fix: [brief description]
```

### Post-Mortem Summary
```
# Post-Mortem: [Incident Title]

## Summary
[What happened, impact, duration]

## Timeline
- [Time] — Issue detected
- [Time] — Investigation started
- [Time] — Root cause identified
- [Time] — Fix deployed
- [Time] — Issue resolved

## Root Cause
[Technical explanation]

## Action Items
- [ ] [Action item 1] — Owner, Due date
- [ ] [Action item 2] — Owner, Due date
```

## Escalation Path

| Level | Who | When |
|-------|-----|------|
| L1 | On-call developer | Initial triage |
| L2 | Core team member | If not resolved in 2 hours |
| L3 | Lead architect | If architectural change needed |
| L4 | External security researcher | For security vulnerabilities |
