import { loadConfigFile } from '@pandacss/config'
import type { ArtifactId, Config, LoadConfigResult, UserConfig } from '@pandacss/types'
import diff, { type Difference } from 'microdiff'
import { Generator } from '@pandacss/generator'
import { dashCase } from '@pandacss/shared'

// Below is the list of all the config paths that can affect an artifact generation
// For some, such as recipes/patterns/jsx-patterns we'll specify which item was specifically affected (e.g. recipes.xxx-yyy)
// so we can avoid generating/re-writing all the other artifacts of the same kind (e.g. recipes.aaa, recipes.bbb, etc.) that didn't change

const all: ConfigPaths[] = ['outdir', 'forceConsistentTypeExtension', 'outExtension']
const format: ConfigPaths[] = ['syntax', 'hash', 'prefix', 'separator']
const tokens: ConfigPaths[] = ['utilities', 'conditions', 'theme.tokens', 'theme.semanticTokens', 'theme.breakpoints']
const jsx: ConfigPaths[] = ['jsxFramework', 'jsxFactory', 'jsxStyleProps', 'syntax']
const css: ConfigPaths[] = ['layers', 'optimize', 'minify']
const common = tokens.concat(jsx, format)

const artifactConfigDeps: Record<ArtifactId, ConfigPaths[]> = {
  helpers: ['syntax', 'jsxFramework'],
  keyframes: ['theme.keyframes', 'layers'],
  'design-tokens': ['layers', '!utilities.*.className'].concat(tokens),
  types: ['!utilities.*.className'].concat(common),
  'css-fn': common,
  cva: ['syntax'],
  sva: ['syntax'],
  cx: [],
  'create-recipe': ['separator', 'prefix', 'hash'],
  'recipes-index': ['theme.recipes', 'theme.slotRecipes'],
  recipes: ['theme.recipes', 'theme.slotRecipes'],
  'patterns-index': ['syntax', 'patterns'],
  patterns: ['syntax', 'patterns'],
  'jsx-is-valid-prop': common,
  'jsx-factory': jsx,
  'jsx-helpers': jsx,
  'jsx-patterns': jsx.concat('patterns'),
  'jsx-patterns-index': jsx.concat('patterns'),
  'css-index': ['syntax'],
  'reset.css': ['preflight', 'layers'],
  'global.css': ['globalCss'].concat(css),
  'static.css': ['staticCss', 'theme.breakpoints'].concat(css),
  'styles.css': tokens.concat(format),
  'package.json': ['emitPackage'],
}

const configDeps = {
  artifacts: artifactConfigDeps,
}

// Prepare a list of regex that resolves to an artifact id from a list of config paths
const matchers = {
  artifacts: Object.keys(configDeps.artifacts).map((key) => {
    const paths = configDeps.artifacts[key as ArtifactId]
    if (!paths.length) return () => undefined

    return createMatcher(key, paths.concat(all))
  }),
}

export interface AffectedResult {
  hasConfigChanged: boolean
  artifacts: Set<ArtifactId>
  diffs: Difference[]
}

export class DiffEngine {
  private previous: Config | undefined

  constructor(private ctx: Generator) {
    this.previous = ctx.conf.deserialize()
  }

  /**
   * Reload config from disk and refresh the context
   */
  async reloadConfigAndRefreshCtx() {
    const conf = await loadConfigFile({ cwd: this.ctx.config.cwd, file: this.ctx.conf.path })
    return this.refresh(conf)
  }

  /**
   * Update the context from the refreshed config
   * then persist the changes on each affected engines
   * Returns the list of affected artifacts/engines
   */
  refresh(conf: LoadConfigResult) {
    const affected: AffectedResult = { artifacts: new Set(), hasConfigChanged: false, diffs: [] }

    if (!this.previous) {
      affected.hasConfigChanged = true
      return affected
    }

    // compute diffs
    const parsed = conf.deserialize()
    const diffList = diff(this.previous, parsed)
    if (!diffList.length) return affected

    affected.hasConfigChanged = true
    affected.diffs = diffList

    // update context
    this.previous = parsed
    this.ctx.setConfig(conf.config)
    this.ctx.conf.dependencies = conf.dependencies

    diffList.forEach((change) => {
      const changePath = change.path.join('.')

      matchers.artifacts.forEach((matcher) => {
        const id = matcher(changePath) as ArtifactId | undefined
        if (!id) return

        // add `recipes.xxx-yyy` to specify which recipes were affected, and later avoid rewriting all recipes
        // same for recipes, use dashCase since those will be used as filenames

        if (id === 'recipes') {
          // ['theme', 'recipes', 'xxx'] => recipes.xxx
          const name = dashCase(change.path.slice(1, 3).join('.') as ArtifactId)
          affected.artifacts.add(name)
        }

        if (id === 'patterns') {
          // ['patterns', 'xxx'] => patterns.xxx
          const name = dashCase(change.path.slice(0, 2).join('.') as ArtifactId)
          affected.artifacts.add(name)
        }

        affected.artifacts.add(id)
      })
    })

    return affected
  }
}

type Keys<T> = keyof NonNullable<T>

/**
 * Get all the (nested) paths of an object until a certain depth
 * e.g. Paths<{a: {b: {c: 1}}}, '', 2> => 'a' | 'a.b' | 'a.b.c'
 */
type Paths<T, Prefix extends string = '', Depth extends number = 0> = {
  [K in keyof T]: Depth extends 0
    ? never
    : T[K] extends object
    ? K extends string
      ? `${Prefix}${K}` | Paths<T[K], `${Prefix}${K}.`, Depth extends 1 ? 0 : Subtract<Depth, 1>>
      : never
    : K extends string | number
    ? `${Prefix}${K}`
    : never
}[keyof T]
type Subtract<T extends number, D extends number> = T extends D ? 0 : T extends D | any ? Exclude<T, D> : never
type PathIn<T, Key extends keyof T> = Key extends string ? Paths<T[Key], `${Key}.`, 1> : never

type ReqConf = Required<UserConfig>

type ConfigPaths = Exclude<
  | Exclude<NonNullable<Keys<ReqConf>>, 'theme'>
  | PathIn<ReqConf, 'theme'>
  | PathIn<ReqConf, 'patterns'>
  | PathIn<ReqConf, 'staticCss'>
  | (string & {}),
  undefined
>

/**
 * Acts like a .gitignore matcher
 * e.g a list of string to search for nested path with glob and exclusion allowed
 * ["outdir", "theme.recipes", '*.css', '!aaa.*.bbb']
 */
function createMatcher(id: string, patterns: string[]) {
  if (!patterns?.length) return () => undefined

  const includePatterns = [] as string[]
  const excludePatterns = [] as string[]
  const deduped = new Set(patterns)

  // Separate inclusion and exclusion patterns
  deduped.forEach((pattern) => {
    // replace '*' with '.*' for regex matching
    const regexString = pattern.replace(/\*/g, '.*')
    if (pattern.startsWith('!')) {
      excludePatterns.push(regexString.slice(1))
    } else {
      includePatterns.push(regexString)
    }
  })

  const include = new RegExp(includePatterns.join('|'))
  const exclude = new RegExp(excludePatterns.join('|'))

  return (path: string) => {
    if (excludePatterns.length && exclude.test(path)) {
      return undefined
    }

    return include.test(path) ? id : undefined
  }
}
