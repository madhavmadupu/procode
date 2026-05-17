# Release Process

## Release Cadence

| Channel | Frequency | Version Pattern | Example |
|---------|-----------|----------------|---------|
| Nightly | Daily | `0.x.x-nightly.YYYYMMDD` | `0.1.0-nightly.20260517` |
| Beta | Weekly | `0.x.x-beta.N` | `0.1.0-beta.1` |
| Stable | Monthly | `x.y.z` | `1.0.0` |

## Version Numbering (SemVer)

- **Major (x)** — Breaking changes, architecture changes
- **Minor (y)** — New features, backward compatible
- **Patch (z)** — Bug fixes, backward compatible

## Release Checklist

### Pre-Release (1 week before)

- [ ] Create release branch from `main`: `release/v1.2.0`
- [ ] Update version in `package.json` and `Cargo.toml`
- [ ] Run full test suite on all platforms
- [ ] Run performance benchmarks, compare to baseline
- [ ] Review and update changelog
- [ ] Test upgrade path from previous version
- [ ] Update documentation for new features
- [ ] Create release notes draft

### Release Day

- [ ] Final QA pass on release branch
- [ ] Tag release: `git tag -a v1.2.0 -m "Release v1.2.0"`
- [ ] Push tag: `git push origin v1.2.0`
- [ ] CI builds and publishes release artifacts
- [ ] Verify release artifacts on GitHub Releases
- [ ] Test downloaded artifacts on each platform
- [ ] Publish release notes
- [ ] Announce on Discord, Twitter, blog

### Post-Release (1-2 days after)

- [ ] Monitor crash reports and error logs
- [ ] Address critical bugs with patch release if needed
- [ ] Update website download links
- [ ] Merge release branch back to `main`
- [ ] Close related GitHub issues
- [ ] Update roadmap with completed items

## Automated Release Pipeline

```yaml
# Triggered by git tag push
on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: ./scripts/build-native.sh
      - run: pnpm build
      - run: pnpm test
      - run: pnpm e2e
      - name: Package
        run: pnpm package:${{ runner.os == 'macOS' && 'mac' || runner.os == 'Windows' && 'win' || 'linux' }}
      - name: Code Sign
        run: ./scripts/sign.sh
      - name: Upload to GitHub Releases
        uses: softprops/action-gh-release@v1
        with:
          files: apps/desktop/dist/*
          body_path: CHANGELOG.md
```

## Hotfix Process

For critical bugs in stable releases:

1. Create hotfix branch from release tag: `hotfix/v1.2.1`
2. Fix the bug
3. Run targeted tests
4. Bump patch version
5. Create patch release: `git tag -a v1.2.1`
6. CI builds and publishes
7. Cherry-pick fix to `main`

## Release Notes Template

```markdown
# ProCode v1.2.0

## What's New

### Knowledge Graph Explorer
Visual graph view of your codebase's semantic structure is now available.
Open it from the Activity Bar (🕸 icon).

### Agent HITL Approval
All agent file writes now go through an approval gate with diff preview.

### Performance Improvements
- 40% faster workspace indexing
- 60% faster vector search for large indices

## Bug Fixes
- Fixed LSP server crash on large TypeScript files
- Fixed Git blame annotations not updating on file save
- Fixed terminal color scheme not respecting theme

## Breaking Changes
- None

## Known Issues
- Knowledge Graph Explorer may be slow for workspaces with 500k+ files

## Full Changelog
https://github.com/procode/procode/compare/v1.1.0...v1.2.0
```

## Rollback Process

If a release has critical issues:

1. Mark release as "draft" on GitHub Releases
2. Update auto-update server to point to previous version
3. Announce issue and rollback on Discord, Twitter
4. Investigate and fix the issue
5. Release patched version

## Release Channels Configuration

```typescript
// Auto-update channel selection
interface UpdateConfig {
  channel: 'stable' | 'beta' | 'nightly';
  autoCheck: boolean;
  autoDownload: boolean;
}

// Default: stable channel, auto-check enabled
// Users can opt-in to beta/nightly in settings
```
