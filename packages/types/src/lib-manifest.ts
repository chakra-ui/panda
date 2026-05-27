/**
 * Schema for `panda.lib.json`. All paths inside are relative to the manifest file.
 *
 * The current schema version is `1`. Writer (`@pandacss/node/manifest-writer`) and
 * reader (`@pandacss/config/lib-manifest`) keep a local literal — bumped together
 * when the shape changes — so this types-only package stays runtime-free.
 */
export interface LibManifest {
  /** Integer schema version of the manifest itself (distinct from buildinfo's schemaVersion). */
  schemaVersion: number
  name: string
  version: string
  /** Semver range of `@pandacss/dev` the lib was built against. */
  panda: string
  /** Path to the preset module, relative to the manifest. */
  preset: string
  /** Name of the preset's export in `preset`. Defaults to `'default'` when omitted. */
  presetExport?: string
  importMap: {
    css?: string
    recipes?: string
    patterns?: string
    jsx?: string
    tokens?: string
  }
  /** Path to `panda.buildinfo.json`, relative to the manifest. */
  buildinfo: string
  /** Optional fallback re-extract globs (relative to package root) when buildinfo can't hydrate. */
  files?: string[]
  /**
   * Parent design system this lib was built against. When set, consumers walk this chain
   * transitively via each parent's own manifest — so an intermediate lib's `preset.ts` can
   * declare only its own additions without importing the parent preset from `node_modules`.
   */
  designSystem?: string
}
