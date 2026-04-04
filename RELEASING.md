# Releasing

## Pre-release checklist

- [ ] Version bumped in `package.json` and `.claude-plugin/plugin.json`
- [ ] `package-lock.json` synced (`npm install --package-lock-only`)
- [ ] `README.md` updated if needed (new settings, changed behavior, etc.)
- [ ] `CHANGELOG.md` updated with new version entry

## Release steps (in order)

### 1. Commit and push

```bash
git add <changed files>
git commit -m "chore: bump to vX.Y.Z — <reason>"
git push origin master
```

### 2. Create and push a GitHub release

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

Then create a release on GitHub from the tag.

### 3. Verify plugin install

```
/plugin marketplace add DavidWilsby/agent-ping
/plugin install agent-ping
```

## Notes

- The plugin is distributed via the self-hosted marketplace (`marketplace.json` in the repo root) and the official Anthropic marketplace.
- Bump version in both `package.json` and `.claude-plugin/plugin.json` — they should always match.
