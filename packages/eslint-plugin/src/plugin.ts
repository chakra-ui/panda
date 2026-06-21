import { Linter, getContextFilename, getContextSource, type LintRuleContextLike } from './core'
import type { ProjectContext } from './core/project-cache'
import type { Deprecation } from '@pandacss/compiler'
import {
  createExtractionDiagnosticsRule,
  createFileNotIncludedRule,
  createNoDebugRule,
  createNoDeprecatedRule,
  createNoImportantRule,
  createNoInvalidTokenPathsRule,
  createNoMarginPropertiesRule,
  createNoPhysicalPropertiesRule,
  createPreferTextStyleRule,
  createPreferTokenRule,
  extractionDiagnosticsRuleName,
  fileNotIncludedRuleName,
  noDebugRuleName,
  noDeprecatedRuleName,
  noImportantRuleName,
  noInvalidTokenPathsRuleName,
  noMarginPropertiesRuleName,
  noPhysicalPropertiesRuleName,
  preferTextStyleRuleName,
  preferTokenRuleName,
} from './rules'
import type { RuleModuleLike } from './rules/shared'

export interface PandaPluginOptions {
  cwd?: string
  configPath?: string
  linter?: Linter
}

export interface PandaProject {
  linter: Linter
  project: ProjectContext
}

export interface PandaPlugin {
  rules: Record<string, RuleModuleLike>
}

/** Preload one Panda project (config load + compiler) for a `(cwd, configPath)`. */
export async function loadPandaProject(options: PandaPluginOptions = {}): Promise<PandaProject> {
  const linter = options.linter ?? new Linter()
  const project = await linter.getProject({
    cwd: options.cwd ?? process.cwd(),
    settings: options.configPath ? { panda: { configPath: options.configPath } } : {},
  })
  return { linter, project }
}

/** Property (and shorthand) → its token category, for every token-backed property. */
function tokenCategoryByProperty(spec: ReturnType<ProjectContext['compiler']['spec']>): Map<string, string> {
  const map = new Map<string, string>()
  for (const [name, property] of Object.entries(spec.utilities.properties)) {
    if (property.tokenCategory) map.set(name, property.tokenCategory)
  }
  for (const [shorthand, canonical] of Object.entries(spec.utilities.shorthands)) {
    const category = map.get(canonical)
    if (category) map.set(shorthand, category)
  }
  return map
}

// CSS-wide keywords (and `currentColor`/`transparent` when not defined as
// tokens) pass through resolution raw but aren't hardcoded values.
const RAW_VALUE_KEYWORDS = new Set([
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'none',
  'auto',
  'currentcolor',
  'transparent',
])

/**
 * A value is hardcoded when the compiler resolves it but the resulting CSS value
 * is not a `var(...)` token reference (and not a CSS-wide keyword). Checking for
 * `var(` is token-prefix agnostic.
 */
function hardcodedValueClassifier(compiler: ProjectContext['compiler']): (prop: string, value: string) => boolean {
  const cache = new Map<string, boolean>()
  return (prop: string, value: string) => {
    const key = `${prop}\0${value}`
    const cached = cache.get(key)
    if (cached !== undefined) return cached

    let result = false
    if (!RAW_VALUE_KEYWORDS.has(value.trim().toLowerCase())) {
      const resolved = compiler.resolveUtilityValue({ prop, value })
      result = resolved !== null && !String(resolved.cssValue).trimStart().startsWith('var(')
    }
    cache.set(key, result)
    return result
  }
}

/** Recipe name → deprecation, merged across recipes and slot recipes. */
function recipeDeprecations(spec: ReturnType<ProjectContext['compiler']['spec']>): Record<string, Deprecation> {
  const out: Record<string, Deprecation> = {}
  for (const recipe of Object.values(spec.recipes)) {
    if (recipe.deprecated !== undefined) out[recipe.name] = recipe.deprecated
  }
  for (const recipe of Object.values(spec.slotRecipes)) {
    if (recipe.deprecated !== undefined) out[recipe.name] = recipe.deprecated
  }
  return out
}

/** Pattern name → deprecation. */
function patternDeprecations(spec: ReturnType<ProjectContext['compiler']['spec']>): Record<string, Deprecation> {
  const out: Record<string, Deprecation> = {}
  for (const pattern of Object.values(spec.patterns)) {
    if (pattern.deprecated !== undefined) out[pattern.name] = pattern.deprecated
  }
  return out
}

/** Bind every rule to an already-loaded project so rule visitors stay synchronous. */
export function bindRules(linter: Linter, project: ProjectContext): Record<string, RuleModuleLike> {
  const spec = project.compiler.spec()
  const categoryByProperty = tokenCategoryByProperty(spec)
  const categoryOf = (prop: string) => categoryByProperty.get(prop)
  const isHardcodedValue = hardcodedValueClassifier(project.compiler)
  const suggest = (prop: string, value: string) => project.compiler.suggestTokens(prop, value)
  const inspect = (context: LintRuleContextLike) =>
    linter.inspectProject(project, getContextFilename(context), getContextSource(context))

  return {
    [extractionDiagnosticsRuleName]: createExtractionDiagnosticsRule({ inspect }),
    [fileNotIncludedRuleName]: createFileNotIncludedRule({
      inspect,
      isSourceFile: (path: string) => project.compiler.isSourceFile(path),
    }),
    [noInvalidTokenPathsRuleName]: createNoInvalidTokenPathsRule({ inspect }),
    [noDeprecatedRuleName]: createNoDeprecatedRule({
      inspect,
      tokens: spec.tokens.deprecated,
      utilities: spec.utilities.deprecated,
      recipes: recipeDeprecations(spec),
      patterns: patternDeprecations(spec),
    }),
    [noDebugRuleName]: createNoDebugRule({ inspect }),
    // `recommended` scopes prefer-token to colors (the old `no-hardcoded-color`).
    [preferTokenRuleName]: createPreferTokenRule({ inspect, categoryOf, isHardcodedValue, suggest }),
    // Opt-in style/enforcement rules (not in `recommended`).
    [noImportantRuleName]: createNoImportantRule({ inspect }),
    [noMarginPropertiesRuleName]: createNoMarginPropertiesRule({ inspect }),
    [noPhysicalPropertiesRuleName]: createNoPhysicalPropertiesRule({ inspect }),
    [preferTextStyleRuleName]: createPreferTextStyleRule({ inspect }),
  }
}

export async function createPandaPlugin(options: PandaPluginOptions = {}): Promise<PandaPlugin> {
  const { linter, project } = await loadPandaProject(options)
  return { rules: bindRules(linter, project) }
}
