# Language service sandbox

Manual testing ground for `@pandacss/typescript-plugin` (classic tsserver plugin) and
`@pandacss/language-server` (LSP). Nothing here runs automated tests — this is for opening
`panda.config.ts` in a real editor and typing.

## Setup

```sh
pnpm install --ignore-scripts
pnpm --filter @pandacss/typescript-plugin build
pnpm --filter @pandacss/language-server build
```

## Testing in VS Code (tsserver plugin)

1. Open `panda.config.ts` from this folder (either open the whole `panda-v2` repo root, or open
   `sandbox/language-service` directly — both have a `.vscode/settings.json` pointing at the
   workspace TypeScript install).
2. VS Code should prompt **"Use Workspace Version"** for TypeScript — accept it (or run
   `TypeScript: Select TypeScript Version` → `Use Workspace Version` from the command palette).
   The plugin only loads under the workspace TS install, not VS Code's bundled one.
3. Follow the `// Try it:` comments in `panda.config.ts` — delete a value and retype it inside:
   - a semantic token reference (`{colors.re...}`) → token path completions
   - a `defineGlobalStyles({...})` selector's style object → utility/condition keys, then values
   - a `defineRecipe({...})`'s `base`/`variants.*.*` → same
4. If nothing shows up: check the **TypeScript: Open TS Server Log** command — search for
   `@pandacss/typescript-plugin` to confirm it loaded (`Enabling plugin ...`, not `Skipped loading
   plugin ... because it did not expose a proper factory function`).

## Testing over LSP (any generic client, e.g. Neovim)

```sh
pnpm --filter sandbox-language-service language-server
```

Runs `panda-language-server --stdio` directly from the built package. Point any LSP client at
that command with this folder as the root — e.g. in Neovim:

```lua
vim.lsp.start({
  name = 'panda-language-server',
  cmd = { 'node', vim.fn.getcwd() .. '/../../packages/language-server/bin/panda-language-server.js', '--stdio' },
  root_dir = vim.fn.getcwd(),
})
```

## Known gaps at this stage

- Only `defineRecipe`'s `base`/`variants.*.*` and `defineGlobalStyles` selectors are recognized —
  `staticCss` has no `define*()` wrapper yet, so it won't get completions (see
  `design-notes/language-service-implementation.md`).
- No `packages/vscode` extension yet — zero-config auto-registration isn't built; this sandbox's
  `tsconfig.json` registers the plugin manually, same as any other tsserver-backed editor would
  today.
