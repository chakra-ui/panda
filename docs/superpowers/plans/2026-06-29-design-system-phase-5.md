# Design Systems Phase 5 (`panda lib` + propagation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the producer half of the `designSystem` feature — a `panda lib` command that turns a library's source into a publishable `panda.lib.json` + `panda.buildinfo.json` + compiled `preset.mjs` and syncs `package.json` exports — plus the consumer-side propagation behaviors deferred from Phase 2 (stale-buildinfo `files` fallback, token-conflict warning) and a backward-looking version drift receipt.

**Architecture:** The hard logic stays fs-free in the Rust engine (`design_system_manifest` / `resolve_chain` already exist; this phase adds a token-conflict scan and keeps the manifest the source of truth). The TypeScript host (`packages/cli`, driver, config) owns all disk + Node-resolution work: bundling the preset, writing artifacts, syncing exports, persisting drift state, and re-extracting stale build info. Preset compilation reuses the existing Rolldown setup from `packages/config/src/bundle.ts`.

**Tech Stack:** Rust (`pandacss_project`), NAPI + wasm bindings, TypeScript (`@pandacss/compiler-shared`, `@pandacss/compiler`, `@pandacss/config`, `@pandacss/cli`), Rolldown, citty, zod, insta + vitest.

## Global Constraints

- CSS output is sacred — no existing `pandacss_stylesheet` insta snapshot or `sandbox/codegen` output may change. Run `cargo nextest run -p pandacss_stylesheet` + `sandbox/codegen` before/after any engine touch.
- Zero code comments in new/edited code (JSDoc/inline/explanatory all banned) per repo convention.
- Rust: `pnpm rust:fmt` + `pnpm rust:clippy` (`-D warnings`) must pass for any `crates/**` or binding change. Public-API tests live in `crates/<name>/tests/`, not `src/`.
- NAPI: `#[napi]` fns take owned `String` (allow `clippy::needless_pass_by_value` with `reason`); `Option<T>` accepts omitted/undefined, never `null`.
- The manifest is the single source of DS roots — never hardcode importMap roots anywhere but where the manifest is built.
- `panda lib` is **idempotent**: running it twice produces no file diff. Serialize with stable key order; only rewrite `package.json` when the exports actually change.
- `panda lib` reads from `src/` (config `include`), never a bundler's `dist/`, so it stays bundler-agnostic.
- Diagnostics follow the `code`/`severity` table in `design-notes/design-system-manifest.md` and the model in `compiler-diagnostics.md`.

---

## File Structure

- `crates/pandacss_project/src/design_system.rs` — add `token_conflicts(local, ds)` pure fn (engine owns resolved-token provenance). Modify.
- `crates/pandacss_project/tests/design_system.rs` — conflict-scan tests. Modify.
- `packages/compiler/crate/src/project/design_system.rs` + `packages/compiler-wasm/crate/src/project/design_system.rs` — mirror the conflict primitive across bindings. Modify.
- `packages/compiler-shared/src/design-system.ts` + `types/compiler.ts` — expose `tokenConflicts` on the `DesignSystem` namespace; add diagnostic result types. Modify.
- `packages/config/src/lib-preset.ts` — **new** preset compiler (Rolldown-bundle config → strip app fields → emit `preset.mjs` source). Create.
- `packages/config/src/lib-manifest.ts` — **new** host-side manifest assembly: read `package.json` identity, derive importMap roots from name, default `files`, sync `exports`. Create.
- `packages/config/src/drift.ts` — **new** persisted version state + drift receipt (read/write `.panda/design-system-state.json`). Create.
- `packages/config/src/index.ts` — re-export the new public helpers. Modify.
- `packages/compiler/src/design-system.ts` — stale-buildinfo `files` re-extract fallback + emit warning instead of throwing when `manifest.files` exists; token-conflict scan on hydrate. Modify.
- `packages/cli/src/commands/lib.ts` — **new** `panda lib` command (+ `--watch`). Create.
- `packages/cli/src/cli-main.ts` — register `lib`. Modify.
- `packages/cli/src/schema.ts` + `args.ts` — `libFlagsSchema` + `LibFlags`/`LibResult`. Modify.
- `packages/cli/__tests__/lib.test.ts` — **new** command integration tests. Create.
- `.changeset/design-system-panda-lib.md` — changeset. Create.
- `design-notes/design-system-manifest.md` — flip Phase 5 to ✅ with the as-built notes. Modify.

---

## Task 1: Engine token-conflict primitive

**Files:**
- Modify: `crates/pandacss_project/src/design_system.rs`
- Test: `crates/pandacss_project/tests/design_system.rs`

**Interfaces:**
- Produces: `pub fn token_conflicts(local: &[String], ds: &[String]) -> Vec<String>` — returns the sorted, deduped set of dotted token paths defined by **both** the consumer (`local`) and a design system (`ds`). Pure, fs-free, value-in/value-out. Used by the binding layer and surfaced as `design_system_token_conflict` (warning, local wins).

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn token_conflicts_reports_shared_paths_sorted() {
    let local = vec!["colors.brand".to_owned(), "colors.fg".to_owned()];
    let ds = vec!["colors.brand".to_owned(), "spacing.sm".to_owned()];
    assert_eq!(pandacss_project::token_conflicts(&local, &ds), vec!["colors.brand".to_owned()]);
}

#[test]
fn token_conflicts_empty_when_disjoint() {
    let local = vec!["colors.fg".to_owned()];
    let ds = vec!["spacing.sm".to_owned()];
    assert!(pandacss_project::token_conflicts(&local, &ds).is_empty());
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cargo nextest run -p pandacss_project token_conflicts --locked`
Expected: FAIL — `token_conflicts` not found.

- [ ] **Step 3: Implement the primitive**

In `design_system.rs`:

```rust
use rustc_hash::FxHashSet;

#[must_use]
pub fn token_conflicts(local: &[String], ds: &[String]) -> Vec<String> {
    let ds_set: FxHashSet<&str> = ds.iter().map(String::as_str).collect();
    let mut hits: Vec<String> = local
        .iter()
        .filter(|path| ds_set.contains(path.as_str()))
        .cloned()
        .collect();
    hits.sort_unstable();
    hits.dedup();
    hits
}
```

Re-export from `crates/pandacss_project/src/lib.rs` (`pub use design_system::token_conflicts;`).

- [ ] **Step 4: Run to verify it passes**

Run: `cargo nextest run -p pandacss_project token_conflicts --locked`
Expected: PASS (both tests).

- [ ] **Step 5: Gates + commit**

```bash
pnpm rust:fmt && pnpm rust:clippy
git add crates/pandacss_project
git commit -m "feat(engine): token-conflict scan primitive for designSystem"
```

---

## Task 2: Mirror the conflict primitive across bindings

**Files:**
- Modify: `packages/compiler/crate/src/project/design_system.rs`
- Modify: `packages/compiler-wasm/crate/src/project/design_system.rs`
- Modify: `packages/compiler-shared/src/design-system.ts`
- Modify: `packages/compiler-shared/src/types/compiler.ts`
- Test: `packages/compiler/__tests__` (binding round-trip)

**Interfaces:**
- Consumes: `pandacss_project::token_conflicts` (Task 1).
- Produces: `DesignSystem.tokenConflicts(local: string[], ds: string[]): string[]` on the JS namespace; binding fn `designSystemTokenConflicts(local: Vec<String>, ds: Vec<String>) -> Vec<String>`.

- [ ] **Step 1: Add the NAPI binding**

In `packages/compiler/crate/src/project/design_system.rs`:

```rust
#[napi]
#[allow(clippy::needless_pass_by_value, reason = "NAPI requires owned Vec params")]
pub fn design_system_token_conflicts(local: Vec<String>, ds: Vec<String>) -> Vec<String> {
    pandacss_project::token_conflicts(&local, &ds)
}
```

Mirror the same fn (wasm-bindgen `#[wasm_bindgen]`, `Vec<String>` params) in the wasm crate, matching the existing `createManifest`/`resolveChain` exports in that file.

- [ ] **Step 2: Wire the binding into `DesignSystemBinding` + `DesignSystem`**

In `compiler-shared/src/design-system.ts` add to the `DesignSystemBinding` interface:

```ts
tokenConflicts(local: string[], ds: string[]): string[]
```

and the method:

```ts
tokenConflicts(local: string[], ds: string[]): string[] {
  return this.#binding.tokenConflicts(local, ds)
}
```

Add `readonly tokenConflicts` is not needed; the method suffices. In `types/compiler.ts` no new shape is required (string arrays).

- [ ] **Step 3: Map the flat binding name in both adapters**

Find where each adapter constructs `DesignSystemBinding` (the `createManifest`/`resolveChain` mapping) and add `tokenConflicts: (l, d) => native.designSystemTokenConflicts(l, d)` (and the wasm equivalent).

- [ ] **Step 4: Build native + round-trip test**

Run:
```bash
pnpm --filter @pandacss/compiler build:native
pnpm --filter @pandacss/compiler test
```
Add a round-trip assertion: `compiler.designSystem.tokenConflicts(['colors.brand'], ['colors.brand','spacing.sm'])` → `['colors.brand']`.
Expected: PASS.

- [ ] **Step 5: Gates + commit**

```bash
pnpm rust:fmt && pnpm rust:clippy
git add crates packages/compiler packages/compiler-wasm packages/compiler-shared
git commit -m "feat(compiler): expose designSystem.tokenConflicts across bindings"
```

---

## Task 3: Preset compiler (`lib-preset.ts`)

**Files:**
- Create: `packages/config/src/lib-preset.ts`
- Modify: `packages/config/src/index.ts`
- Test: `packages/config/__tests__/lib-preset.test.ts`

**Interfaces:**
- Produces: `compilePreset(configPath: string, cwd: string): Promise<{ code: string; dependencies: string[] }>` — Rolldown-bundles the author config into a self-contained ESM module whose default export is the config **stripped of app/parent fields** (`designSystem`, `include`, `exclude`, `outdir`, `cwd`, `watch`, `clean`, `gitignore`, `importMap`). The returned `code` is written verbatim to `preset.mjs`. Functions (utility transforms, recipe callbacks) survive because the code is bundled, never JSON-serialized.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { compilePreset } from '../src/lib-preset'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

describe('compilePreset', () => {
  it('strips app fields and keeps preset additions incl. functions', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'panda-lib-'))
    const file = join(dir, 'panda.config.ts')
    writeFileSync(
      file,
      `export default {
        designSystem: '@acme/foundations',
        include: ['./src/**/*.tsx'],
        outdir: 'styled-system',
        theme: { tokens: { colors: { brand: { value: '#f00' } } } },
        utilities: { mx: { transform: (v) => ({ marginLeft: v, marginRight: v }) } },
      }`,
    )
    const { code } = await compilePreset(file, dir)
    const out = join(dir, 'preset.mjs')
    writeFileSync(out, code)
    const mod = (await import(pathToFileURL(out).href)).default
    expect(mod.designSystem).toBeUndefined()
    expect(mod.include).toBeUndefined()
    expect(mod.outdir).toBeUndefined()
    expect(mod.theme.tokens.colors.brand.value).toBe('#f00')
    expect(typeof mod.utilities.mx.transform).toBe('function')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test packages/config/__tests__/lib-preset.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `compilePreset`**

Reuse the Rolldown config from `bundle.ts` but generate code (not eval). Append a re-export wrapper that strips app fields at module-eval time. The bundled entry is renamed so the wrapper can re-import it from the same chunk via a synthesized second entry — simplest is to wrap the bundled code:

```ts
import { builtinModules } from 'node:module'
import { rolldown } from 'rolldown'
import { importMetaUrlPlugin } from './bundle-plugins'
import { PandaError } from './error'

const APP_FIELDS = ['designSystem', 'include', 'exclude', 'outdir', 'cwd', 'watch', 'clean', 'gitignore', 'importMap']
const nodeBuiltins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)])

export async function compilePreset(configPath: string, cwd: string): Promise<{ code: string; dependencies: string[] }> {
  const build = await rolldown({
    input: configPath,
    cwd,
    platform: 'node',
    external: (id) => nodeBuiltins.has(id),
    treeshake: true,
    plugins: [importMetaUrlPlugin()],
  })
  let chunks: Awaited<ReturnType<typeof build.generate>>
  try {
    chunks = await build.generate({ format: 'esm', exports: 'named', codeSplitting: false })
  } finally {
    await build.close?.()
  }
  const output = chunks.output.find((i) => i.type === 'chunk')
  if (!output || output.type !== 'chunk') {
    throw new PandaError('CONFIG_ERROR', '💥 Preset bundle did not produce an executable module.')
  }
  const dependencies = Object.keys(output.modules ?? {})
  const stripped = APP_FIELDS.map((f) => JSON.stringify(f)).join(', ')
  const code =
    output.code.replace(/export\s+default\s+/, 'const __panda_lib_config = ') +
    `\nconst { ${APP_FIELDS.join(', ')} } = __panda_lib_config\n` +
    `const __panda_lib_preset = { ...__panda_lib_config }\n` +
    `for (const __k of [${stripped}]) delete __panda_lib_preset[__k]\n` +
    `export default __panda_lib_preset\n`
  return { code, dependencies }
}
```

> ponytail: string-replacing the single `export default` is the lazy path; the destructure binding is unused (kept only to satisfy `no-unused` lint via the delete loop). If a config emits `export { x as default }`, switch to a wrapper-entry Rolldown pass. Add when a real config trips it.

Re-export `compilePreset` from `index.ts`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test packages/config/__tests__/lib-preset.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/config/src/lib-preset.ts packages/config/src/index.ts packages/config/__tests__/lib-preset.test.ts
git commit -m "feat(config): compile designSystem preset.mjs from author config"
```

---

## Task 4: Host manifest assembly + exports sync (`lib-manifest.ts`)

**Files:**
- Create: `packages/config/src/lib-manifest.ts`
- Modify: `packages/config/src/index.ts`
- Test: `packages/config/__tests__/lib-manifest.test.ts`

**Interfaces:**
- Consumes: `DesignSystemManifestInput` (compiler-shared types).
- Produces:
  - `readPackageIdentity(cwd: string): { name: string; version?: string; pandaPeer?: string }` — reads nearest `package.json`; `pandaPeer` from `peerDependencies['@pandacss/dev']`.
  - `defaultImportMap(name: string): DesignSystemManifestImportMap` — `{ css: \`${name}/css\`, recipes: \`${name}/recipes\`, patterns: \`${name}/patterns\`, jsx: \`${name}/jsx\`, tokens: \`${name}/tokens\` }`.
  - `syncExports(pkgPath: string, entries: Record<string,string>): { changed: boolean; json: string }` — merges `entries` into `package.json#exports`, stable key order, returns serialized text; `changed=false` when already present (idempotency).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { defaultImportMap, syncExports } from '../src/lib-manifest'

describe('lib-manifest', () => {
  it('derives importMap roots from package name', () => {
    expect(defaultImportMap('@acme/ds').css).toBe('@acme/ds/css')
    expect(defaultImportMap('@acme/ds').tokens).toBe('@acme/ds/tokens')
  })
  it('syncExports is idempotent', () => {
    const pkg = JSON.stringify({ name: '@acme/ds', exports: { './preset': './dist/preset.mjs' } })
    const first = syncExports(pkg, { './preset': './dist/preset.mjs', './panda.lib.json': './dist/panda.lib.json' })
    expect(first.changed).toBe(true)
    const second = syncExports(first.json, { './preset': './dist/preset.mjs', './panda.lib.json': './dist/panda.lib.json' })
    expect(second.changed).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test packages/config/__tests__/lib-manifest.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`syncExports` parses the passed JSON string (not the file — keeps it pure/testable), merges entries into `exports`, sorts keys, compares to detect `changed`, returns `{ changed, json: JSON.stringify(next, null, 2) + '\n' }`. `readPackageIdentity` walks up for `package.json` (reuse the `nearestNodeModules`-style walk) and reads `name`/`version`/`peerDependencies['@pandacss/dev']`. `defaultImportMap` is the literal above. Re-export all three from `index.ts`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test packages/config/__tests__/lib-manifest.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/config/src/lib-manifest.ts packages/config/src/index.ts packages/config/__tests__/lib-manifest.test.ts
git commit -m "feat(config): host manifest assembly + idempotent exports sync"
```

---

## Task 5: `panda lib` command (no watch yet)

**Files:**
- Create: `packages/cli/src/commands/lib.ts`
- Modify: `packages/cli/src/cli-main.ts`, `packages/cli/src/schema.ts`, `packages/cli/src/args.ts`
- Test: `packages/cli/__tests__/lib.test.ts`

**Interfaces:**
- Consumes: `compilePreset`, `readPackageIdentity`, `defaultImportMap`, `syncExports` (Tasks 3–4); `driver.compiler.buildInfo.create/normalize`, `driver.compiler.designSystem.create` (existing).
- Produces: `runLib(flags, output): Promise<LibResult>` and the citty `libCommand`. `LibResult` shape: `{ manifestPath: string; buildInfoPath: string; presetPath: string; exportsChanged: boolean }`.

- [ ] **Step 1: Write the failing integration test**

A fixture package dir with `panda.config.ts` + `package.json` + a `src/` file using `css({...})`. Run `runLib({ cwd: fixture, outdir: 'dist' })`. Assert all three files exist, `panda.lib.json` parses with `schemaVersion:1`, `name`, `panda`, `preset:'./preset.mjs'`, `buildInfo:'./panda.buildinfo.json'`, importMap roots; assert a second run yields `exportsChanged:false` and byte-identical `panda.lib.json` (idempotency).

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test packages/cli/__tests__/lib.test.ts`
Expected: FAIL — `runLib` not found.

- [ ] **Step 3: Add flags schema + args**

`libFlagsSchema` (zod) in `schema.ts`: `baseArgs` + `outdir` (default `'dist'`), `panda` (peer range override), `files` (string[], re-extract fallback globs; default `['./dist/**/*.{js,mjs}']`), `minify`, `watch`, output/trace args. Export `LibFlags`/`LibResult` types.

- [ ] **Step 4: Implement `runLib`** (model on `runBuildinfo`)

Flow inside `runCommand`'s `execute`: `driver.parseFiles()` → build+normalize buildinfo (relative module keys) → `compilePreset(driver.configPath, cwd)` → `readPackageIdentity(cwd)` (peer range precedence: flag `--panda` > peerDep > `'*'`) → assemble `DesignSystemManifestInput` (name, version, panda, `preset:'./preset.mjs'`, `buildInfo:'./panda.buildinfo.json'`, `importMap: defaultImportMap(name)`, `designSystem: driver.config.designSystem`, `files`) → `driver.compiler.designSystem.create(input)` → write the three files into `<cwd>/<outdir>/` (mkdir -p; stable `JSON.stringify(..., 2)`, minify flag for buildinfo) → `syncExports` against `<cwd>/package.json` (`./panda.lib.json`, `./preset` → `./<outdir>/...`), write back only when `changed`. Register manifest/buildinfo/preset/package.json as command deps for `--watch`.

- [ ] **Step 5: Register command**

In `cli-main.ts` add `lib: libCommand` to the subcommand map.

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm test packages/cli/__tests__/lib.test.ts`
Expected: PASS (incl. idempotency assertions).

- [ ] **Step 7: CLI UX review + commit**

Invoke `cli-design-expert` on `lib.ts` help/flags/errors. Then:
```bash
pnpm test packages/cli
git add packages/cli
git commit -m "feat(cli): add panda lib command"
```

---

## Task 6: `panda lib --watch`

**Files:**
- Modify: `packages/cli/src/commands/lib.ts`
- Test: `packages/cli/__tests__/lib.test.ts`

**Interfaces:**
- Consumes: the same watcher the app dev/cssgen `--watch` mode uses (find via `rg -n "watch" packages/cli/src/commands/cssgen.ts`).

- [ ] **Step 1:** Reuse the existing CLI watcher over `driver.config.include` (src globs) + config deps; on change, re-run the Task-5 `execute` body. Assert (test) that editing a `src/` file regenerates `panda.buildinfo.json`. Keep it a thin loop — no bespoke watcher.
- [ ] **Step 2:** Run `pnpm test packages/cli/__tests__/lib.test.ts` → PASS.
- [ ] **Step 3:** Commit `feat(cli): panda lib --watch regenerates on src changes`.

> ponytail: if cssgen's watcher isn't trivially reusable as a function, gate `--watch` behind a clear "not yet" error rather than hand-rolling a second chokidar setup. Decide at implementation time from what cssgen exposes.

---

## Task 7: Drift receipt + persisted state (`drift.ts`)

**Files:**
- Create: `packages/config/src/drift.ts`
- Modify: `packages/config/src/index.ts`, `packages/compiler/src/design-system.ts`
- Test: `packages/config/__tests__/drift.test.ts`

**Interfaces:**
- Produces:
  - `readDriftState(cwd: string): Record<string, string>` — reads `<cwd>/.panda/design-system-state.json` (name → last-seen version), `{}` when absent.
  - `diffDrift(prev, chain): { name: string; from?: string; to: string }[]` — pure; entries where `chain[i].version !== prev[name]`.
  - `writeDriftState(cwd, chain): void` — persists name → version.
- The receipt is `info` severity (`design_system_version_changed`), format `[designSystem] @acme/ds: 1.0.0 → 1.1.0`, never networked, never enforced.

- [ ] **Step 1: Write failing test** for `diffDrift` (pure): prev `{'@acme/ds':'1.0.0'}`, chain with version `1.1.0` → one entry `{name,from:'1.0.0',to:'1.1.0'}`; unchanged version → empty.
- [ ] **Step 2:** Run `pnpm test packages/config/__tests__/drift.test.ts` → FAIL.
- [ ] **Step 3:** Implement the three fns (atomic write via temp+rename; `mkdir -p .panda`). Re-export from `index.ts`. In `hydrateDesignSystem`, after a successful chain hydrate, compute `diffDrift` and emit each as an `info` diagnostic, then `writeDriftState`.
- [ ] **Step 4:** Run `pnpm test packages/config/__tests__/drift.test.ts` → PASS.
- [ ] **Step 5:** Commit `feat(config): designSystem version drift receipt + persisted state`.

---

## Task 8: Stale-buildinfo `files` re-extract fallback + token-conflict warning

**Files:**
- Modify: `packages/compiler/src/design-system.ts`
- Modify: `packages/config/src/design-system.ts` (carry resolved `files` abs paths already present on `ResolvedDesignSystem`)
- Test: `packages/compiler/__tests__/design-system.test.ts` (or nearest existing suite)

**Interfaces:**
- Consumes: `compiler.designSystem.load` result `{ ok:false, reason }`; `compiler.designSystem.tokenConflicts` (Task 2); `ds.files` + `ds.manifestPath` (resolve globs relative to manifest dir).

- [ ] **Step 1: Stale fallback test** — given a manifest whose buildInfo `load` returns `ok:false` but `manifest.files` is non-empty, `hydrateLevel` must NOT throw; it re-extracts `files` (scoped to the DS package dir, via the driver/compiler parse path) and the compiler records a `design_system_buildinfo_stale` warning. When `files` is empty, it still throws (fail-closed). Write both assertions.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement: in `hydrateLevel`, wrap the `load` failure — if `ds.files.length`, resolve globs against `dirname(ds.manifestPath)`, parse them into the compiler (re-extract that one layer), push `design_system_buildinfo_stale` warning; else keep the throw. After hydrate, run `tokenConflicts(localTokenPaths, dsTokenPaths)` and push a `design_system_token_conflict` warning per hit (local wins — no value change, warning only). Source the token-path lists from the resolved config / DS preset token definitions.
- [ ] **Step 4:** Run → PASS. Then full guard: `cargo nextest run -p pandacss_stylesheet` + `sandbox/codegen` unchanged.
- [ ] **Step 5:** Commit `feat(compiler): stale-buildinfo fallback + token-conflict warning`.

---

## Task 9: Changeset + design-note flip

**Files:**
- Create: `.changeset/design-system-panda-lib.md`
- Modify: `design-notes/design-system-manifest.md`

- [ ] **Step 1:** Changeset (`@pandacss/cli` minor, `@pandacss/config` + `@pandacss/compiler` minor): "Add `panda lib` to publish a design system (manifest + portable build info + compiled preset) and sync `package.json` exports. Consumers get a version drift receipt, token-conflict warnings, and an automatic re-extract fallback when a library's build info is stale." Follow repo TONE_OF_VOICE (lead with the point, "you", sentence case, no hype).
- [ ] **Step 2:** In the design note, change Phase 5 line to `✅ Complete` with one paragraph of as-built notes (preset-strip approach, exports synced = manifest+preset only, styled-system subpath exports deferred to Phase 6, cross-package source watch still open item #4).
- [ ] **Step 3:** Commit `docs(designSystem): mark Phase 5 complete + changeset`.

---

## Self-Review notes

- **Spec coverage:** Task 5/6 = `panda lib` (+watch) glob→create→write→sync; Task 7 = drift receipt + persisted state + build deps (deps registered in Task 5); Task 8 = stale-buildinfo fallback + token-conflict warning. `ship`/`emit-pkg` removal is a no-op (absent on v2) — noted, no task. Phase 6 (overlay codegen, full styled-system exports) explicitly out of scope.
- **Deferred (documented, not silently dropped):** cross-package **source** watch (open item #4) beyond config-dep invalidation; styled-system subpath exports (`./css` etc.) — those outputs come from codegen, Phase 6.
- **Type consistency:** `compilePreset` → `{code,dependencies}`; `syncExports` → `{changed,json}`; `LibResult` fields used identically in command + test.
