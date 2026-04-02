# Releasing

## Pre-release checklist

- [ ] Version bumped in `package.json`
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

### 2. Publish to npm

```bash
npm publish
```

### 3. Create and push a GitHub release

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

Then create a release on GitHub from the tag.

### 4. Build .vsix

```bash
npx vsce package
```

This produces `agent-ping-vscode-X.Y.Z.vsix`.

### 5. Upload .vsix to marketplaces

Manually upload the `.vsix` file to:

1. [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. [Open VSX Registry](https://open-vsx.org/)

## Notes

- Marketplace registries do not allow re-uploading an existing version. If a packaging mistake is found post-publish, bump the patch version.
- The `.vsix` is built from the working tree, so all changes must be committed before running `npx vsce package`.
- Building and uploading the `.vsix` is always the very last step.
