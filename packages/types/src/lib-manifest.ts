/**
 * Current schema version of `panda.lib.json`. Bump when the manifest shape changes
 * in a way that older readers can't handle, and add a branch to the reader's
 * version check at the same time. Mismatched versions error rather than silently
 * misbehave.
 */
export const CURRENT_LIB_MANIFEST_VERSION = 1

/** Schema for `panda.lib.json`. All paths inside are relative to the manifest file. */
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
