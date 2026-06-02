import type { CodegenDependency, ConfigDiff, SerializedConfig } from '@pandacss/compiler-shared'
import diff from 'microdiff'

export type { ConfigDiff } from '@pandacss/compiler-shared'

/** Every `CodegenDependency` — the full-regen set used on first load. */
const ALL_DEPENDENCIES: CodegenDependency[] = [
  'codegenFormat',
  'codegenImportExtensions',
  'conditions',
  'hash',
  'jsxFactory',
  'jsxFramework',
  'jsxStyleProps',
  'patterns',
  'prefix',
  'recipes',
  'separator',
  'syntax',
  'themes',
  'tokens',
  'utilities',
]

/**
 * Structurally diff two serialized configs and map each change to the coarse
 * `CodegenDependency` bits the Rust engine regenerates by. Ported from v1's
 * `diffConfigs` (`packages/config/src/diff-config.ts`), but targeting the
 * engine's `generateAffectedArtifacts(CodegenDependency[])` seam rather than v1's
 * per-file `ArtifactId` set.
 *
 * **Known gap:** the diff runs on the `SerializedConfig`, where functions are
 * lowered to stable `{ kind:'js-callback', id }` refs — so a `utilities.*.transform`
 * *body* edit is invisible here. Pattern transform bodies escape this because
 * they're captured as a `codegenSource` string. Precise callback-change detection
 * (hashing lowered sources) is deferred.
 */
export function diffConfig(prev: SerializedConfig | undefined, next: SerializedConfig): ConfigDiff {
  if (!prev) {
    return { hasChanged: true, dependencies: [...ALL_DEPENDENCIES], recipes: [], patterns: [], changes: [] }
  }

  const changes = diff(prev, next)
  if (changes.length === 0) {
    return { hasChanged: false, dependencies: [], recipes: [], patterns: [], changes }
  }

  const dependencies = new Set<CodegenDependency>()
  const recipes = new Set<string>()
  const patterns = new Set<string>()

  for (const change of changes) {
    const classified = classify(change.path.map(String))
    classified.deps.forEach((dep) => dependencies.add(dep))
    if (classified.recipe) recipes.add(classified.recipe)
    if (classified.pattern) patterns.add(classified.pattern)
  }

  return {
    hasChanged: true,
    dependencies: [...dependencies],
    recipes: [...recipes],
    patterns: [...patterns],
    changes,
  }
}

interface Classified {
  deps: CodegenDependency[]
  recipe?: string
  pattern?: string
}

/** Map one changed config path to the dependency bits (and recipe/pattern name) it affects. */
function classify([head, second, third]: string[]): Classified {
  if (head === 'theme') {
    if (second === 'recipes' || second === 'slotRecipes') {
      return { deps: ['recipes'], recipe: third }
    }
    // tokens, semanticTokens, breakpoints, containerNames/Sizes, keyframes, …
    return { deps: ['tokens'] }
  }

  switch (head) {
    case 'conditions':
      return { deps: ['conditions'] }
    case 'utilities':
      return { deps: ['utilities'] }
    case 'patterns':
      return { deps: ['patterns'], pattern: second }
    case 'themes':
      return { deps: ['themes'] }
    case 'syntax':
      return { deps: ['syntax'] }
    case 'hash':
      return { deps: ['hash'] }
    case 'prefix':
      return { deps: ['prefix'] }
    case 'separator':
      return { deps: ['separator'] }
    case 'jsxFramework':
      return { deps: ['jsxFramework'] }
    case 'jsxFactory':
      return { deps: ['jsxFactory'] }
    case 'jsxStyleProps':
      return { deps: ['jsxStyleProps'] }
    case 'codegenFormat':
      return { deps: ['codegenFormat'] }
    case 'codegenImportExtensions':
      return { deps: ['codegenImportExtensions'] }
    case 'outExtension':
    case 'forceConsistentTypeExtension':
    case 'shorthands':
    case 'strictTokens':
    case 'strictPropertyValues':
      return { deps: ['codegenFormat'] }
    default:
      return { deps: [] }
  }
}
