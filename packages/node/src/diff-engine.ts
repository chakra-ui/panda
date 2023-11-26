import { loadConfigFile } from '@pandacss/config'
import { Generator } from '@pandacss/generator'
import { dashCase } from '@pandacss/shared'
import type { ArtifactId, Config, ConfigPath, LoadConfigResult } from '@pandacss/types'
import diff, { type Difference } from 'microdiff'
import { createMatcher } from './matcher'

// Below is the list of all the config paths that can affect an artifact generation
// For some, such as recipes/patterns/jsx-patterns we'll specify which item was specifically affected (e.g. recipes.xxx-yyy)
// so we can avoid generating/re-writing all the other artifacts of the same kind (e.g. recipes.aaa, recipes.bbb, etc.) that didn't change

const all: ConfigPath[] = ['outdir', 'forceConsistentTypeExtension', 'outExtension']
const format: ConfigPath[] = ['syntax', 'hash', 'prefix', 'separator']
const tokens: ConfigPath[] = ['utilities', 'conditions', 'theme.tokens', 'theme.semanticTokens', 'theme.breakpoints']
const jsx: ConfigPath[] = ['jsxFramework', 'jsxFactory', 'jsxStyleProps', 'syntax']
const css: ConfigPath[] = ['layers', 'optimize', 'minify']
const common = tokens.concat(jsx, format)

const artifactConfigDeps: Record<ArtifactId, ConfigPath[]> = {
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

export interface DiffConfigResult {
  hasConfigChanged: boolean
  artifacts: Set<ArtifactId>
  diffs: Difference[]
}

export class DiffEngine {
  private previousConfig: Config | undefined

  constructor(private ctx: Generator) {
    this.previousConfig = ctx.conf.deserialize()
  }

  /**
   * Reload config from disk and refresh the context
   */
  async reloadConfigAndRefreshContext(fn?: (conf: LoadConfigResult) => void) {
    const conf = await loadConfigFile({ cwd: this.ctx.config.cwd, file: this.ctx.conf.path })
    return this.refresh(conf, fn)
  }

  /**
   * Update the context from the refreshed config
   * then persist the changes on each affected engines
   * Returns the list of affected artifacts/engines
   */
  refresh(conf: LoadConfigResult, fn?: (conf: LoadConfigResult) => void) {
    const affected: DiffConfigResult = {
      artifacts: new Set(),
      hasConfigChanged: false,
      diffs: [],
    }

    if (!this.previousConfig) {
      affected.hasConfigChanged = true
      return affected
    }

    // compute diffs
    const newConfig = conf.deserialize()
    const configDiff = diff(this.previousConfig, newConfig)

    if (!configDiff.length) {
      return affected
    }

    affected.hasConfigChanged = true
    affected.diffs = configDiff

    this.previousConfig = newConfig
    fn?.(conf)

    configDiff.forEach((change) => {
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
