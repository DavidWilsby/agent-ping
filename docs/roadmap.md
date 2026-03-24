# Roadmap

## One-click CLI install

The extension and CLI are separate installs today — the vsix for the editor, `npm i -g agent-ping` for the CLI that hooks call. This is a friction point for new users.

**Goal:** Reduce install to a single step.

**Approach:** Add an **"Install"** button to the global-install warning notification. When clicked, the extension runs `npm i -g agent-ping` via a VS Code terminal or `child_process`, then re-checks for the binary automatically. The README would then simplify to: install the vsix, reload, click Install when prompted.

**Considerations:**
- Need to handle permission errors (e.g. macOS may need `sudo` depending on Node install method)
- nvm/asdf users may have different npm prefixes per shell session — running from VS Code's terminal should use the correct one
- Windows: `npm` must be on PATH in the VS Code integrated terminal

---

## VS Code Marketplace extension

Agent Ping is currently distributed as a `.vsix` sideload. Publishing to the VS Code Marketplace would enable one-click install and automatic updates.

**What's needed:**
- A verified publisher on the [VS Code Marketplace](https://marketplace.visualstudio.com/manage) (publisher ID: `dawi` is already set in package.json)
- An Azure DevOps personal access token (PAT) for publishing
- Run `npx @vscode/vsce publish` to publish (or set up CI)

**Benefits:**
- Users install via the Extensions sidebar — no downloading vsix files
- Updates are automatic
- Discoverability via Marketplace search

**Considerations:**
- The CLI global install is still a separate step — the Marketplace only handles the extension. The one-click CLI install feature (above) becomes even more important once the extension is on the Marketplace, since users will expect everything to "just work" after install.
- Cursor and Windsurf use the Open VSX registry, not the VS Code Marketplace. To cover all three editors, publish to both Marketplace and [Open VSX](https://open-vsx.org/).
- Review the `package.json` fields (`repository`, `icon`, `categories`, `galleryBanner`) for Marketplace presentation.
