// ---------------------------------------------------------------------------
// Build info — portable design-system encoder state (`panda.buildinfo.json`)
// ---------------------------------------------------------------------------

/** A value-interned atom: `p`rop / `v`alue / `c`onditions reference the
 *  `BuildInfo.strings` table; `v` is a bare index (string),
 *  `{ t, v }` (token path + resolved value), `{ n }` (number, drives px), a
 *  boolean, or null. `c`/`i` omitted when empty/false. */
export interface BuildAtom {
  p: number
  v: number | { t: number; v: number } | { n: number } | boolean | null
  c?: number[]
  i?: boolean
}

/** An interned recipe / slot-recipe style group, mirroring the engine's
 *  `RecipeStyleGroupSnapshot`: `r`ecipe name, optional `slot`, `cls` class name
 *  (all string indices), `cond`itions, and `entries` ({@link BuildAtom}). */
export interface BuildRecipeGroup {
  r: number
  slot?: number
  cls: number
  cond?: number[]
  entries: BuildAtom[]
}

/** Interned recipe state. `base`/`variants` are addressed by a combined index
 *  (base first, variants continuing) — what `modules[].recipes` references;
 *  `atomic` styles hydrate wholesale (they're recipe-wide). */
export interface BuildRecipes {
  base?: BuildRecipeGroup[]
  variants?: BuildRecipeGroup[]
  compounds?: BuildRecipeGroup[]
  atomic?: BuildAtom[]
}

/** Per-module provenance: indices into the artifact's `atoms` / `recipes` that a
 *  given library module uses. Drives module-filtered (tree-shaken) hydration. */
export interface BuildModuleEntry {
  atoms?: number[]
  recipes?: number[]
}

/** `panda.buildinfo.json` — a design-system library's serialized encoder state.
 *  A consumer hydrates it (optionally per-module, for tree-shaking) instead of
 *  re-extracting the library's components. */
export interface BuildInfo {
  schemaVersion: number
  /** Peer Panda version range the artifact was built against (collision guard);
   *  author-supplied via `create({ panda })`. */
  panda: string
  /** The producing engine's fingerprint of its output-affecting config (collision
   *  guard). Stable across machines; a consumer compares it against its own
   *  `compiler.buildInfo.configFingerprint`. */
  configFingerprint: string
  /** Intern table — every prop / condition / value string, referenced by index. */
  strings: string[]
  atoms: BuildAtom[]
  /** Interned config recipe / slot-recipe styles; absent when the library has
   *  none. Inline `cva`/`sva` and patterns are _not_ here — they decompose to
   *  `atoms` in their module and travel that way. */
  recipes?: BuildRecipes
  /** Published module key → indices into `atoms` / `recipes`, for module-filtered
   *  hydration. Keys are importable module ids (e.g. `"button"` for
   *  `@acme/ds/button`). */
  modules: Record<string, BuildModuleEntry>
  /** Exported component name → module key, so a consumer can resolve a barrel
   *  import (`import { Button } from '@acme/ds'`) to the module whose styles it
   *  needs (e.g. the one whose recipe `Button` consumes). Emitted by the engine
   *  for modules that contribute styles; absent when empty. Cross-file re-exports
   *  (`export { X } from './y'`, `export * from './y'`) are resolved project-side
   *  before serialization. */
  exports?: Record<string, string>
}

/** Why an external build info is incompatible with the consuming compiler.
 *  `schemaVersion` is decided by the engine (`validate`); `pandaRange` is a
 *  host-layer verdict (it knows the running Panda version). */
export type BuildInfoIncompatibility = 'schemaVersion' | 'pandaRange'

/** Discriminated result so `ok: true` narrows away `reason`. */
export type BuildInfoCompatibility = { ok: true } | { ok: false; reason: BuildInfoIncompatibility }

export interface BuildInfoCreateOptions {
  /** Peer Panda version range to stamp into the artifact (the library author's
   *  published compatibility range). */
  panda: string
}

export interface BuildInfoHydrateOptions {
  /** Stable name for the source design system — keys the hydrated atoms so a
   *  later hydrate of the same name replaces cleanly (e.g. the package name). */
  name: string
  /** Restrict hydration to these module keys (the consumer's imported
   *  components) so only their CSS emits — tree-shaking. Omit to hydrate all. */
  only?: string[]
}

/** Discriminated result. On success, `modules` is the set actually hydrated
 *  (the requested `only` intersected with the artifact's modules, or all of
 *  them). On failure it's empty and `reason` says why. */
export type BuildInfoHydrateResult =
  | { ok: true; modules: string[] }
  | { ok: false; reason: BuildInfoIncompatibility; modules: [] }

/** Produce, validate, and hydrate `panda.buildinfo.json` — a design system's
 *  portable encoder state. Accessed as `compiler.buildInfo`. */
export interface BuildInfoApi {
  /** This compiler's own config fingerprint — the value `create` stamps as
   *  `configFingerprint`. A consumer compares it against an artifact's
   *  `configFingerprint` to tell whether both sides were built with the same
   *  output-affecting config. */
  readonly configFingerprint: string

  /** Serialize this project's encoded atoms + recipes into a portable build info,
   *  with per-module provenance — the producer side (`panda buildinfo`). */
  create(options: BuildInfoCreateOptions): BuildInfo

  /** Check an external build info's wire compatibility with this compiler
   *  (`schemaVersion`) without mutating anything. The Panda peer-range verdict is
   *  layered on by the host, which knows the running version. */
  validate(buildInfo: BuildInfo): BuildInfoCompatibility

  /** Resolve which library modules a set of barrel-imported export names touch,
   *  via the build info's `exports` map — the bridge from "what the app imports"
   *  to the `only` filter. Subpath imports are already module keys (pass them
   *  straight to `hydrate`); a namespace import means "all modules" (omit
   *  `only`). Unknown names are ignored. */
  modulesFor(buildInfo: BuildInfo, exportNames: string[]): string[]

  /** Hydrate an external build info into this project — the consumer side
   *  (`designSystem`). Validates first; an incompatible artifact is a no-op
   *  ({@link BuildInfoHydrateResult.ok} `false`) the caller handles by
   *  re-extracting the library's source. */
  hydrate(buildInfo: BuildInfo, options: BuildInfoHydrateOptions): BuildInfoHydrateResult
}
