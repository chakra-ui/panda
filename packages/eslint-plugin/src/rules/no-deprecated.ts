import type { Deprecation, SourceRange } from '@pandacss/compiler'
import { type Inspect, type RuleContextWithReport, type RuleModuleLike, toEslintLoc } from './shared'

export const noDeprecatedRuleName = 'no-deprecated'

export type DeprecationKind = 'tokens' | 'utilities' | 'recipes' | 'patterns'
const ALL_KINDS: readonly DeprecationKind[] = ['tokens', 'utilities', 'recipes', 'patterns']

/** Token paths never contain `/`; strip a trailing `/opacity` color modifier. */
function stripModifier(path: string): string {
  const slash = path.indexOf('/')
  return slash === -1 ? path : path.slice(0, slash)
}

export interface NoDeprecatedRuleOptions {
  inspect: Inspect
  /** Token path → deprecation. */
  tokens: Record<string, Deprecation>
  /** Canonical property → deprecation. */
  utilities: Record<string, Deprecation>
  /** Recipe name → deprecation. */
  recipes: Record<string, Deprecation>
  /** Pattern name → deprecation. */
  patterns: Record<string, Deprecation>
}

export function createNoDeprecatedRule(options: NoDeprecatedRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Report usage of deprecated Panda tokens, utilities, and recipes.',
      },
      schema: [
        {
          type: 'object',
          properties: {
            kinds: { type: 'array', items: { enum: [...ALL_KINDS] }, uniqueItems: true },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        deprecated: 'Panda {{kind}} "{{name}}" is deprecated.{{note}}',
      },
    },
    create(context) {
      const configured = (context.options?.[0] as { kinds?: DeprecationKind[] } | undefined)?.kinds
      const kinds = new Set<DeprecationKind>(configured ?? ALL_KINDS)

      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return

          if (kinds.has('tokens')) {
            // `usages` covers token() calls, bare values, conditions, and arrays
            // with the path normalized; tokenRefs misses bare values.
            for (const usage of inspection.usages) {
              if (usage.kind !== 'token') continue
              const path = stripModifier(usage.name)
              const deprecation = options.tokens[path]
              if (deprecation === undefined) continue
              report(context, 'token', path, deprecation, usage.range)
            }
          }

          if (kinds.has('utilities')) {
            for (const entry of inspection.styleEntries) {
              if (entry.kind !== 'utility') continue
              const prop = entry.canonicalName ?? entry.name
              const deprecation = options.utilities[prop]
              if (deprecation === undefined) continue
              report(context, 'property', prop, deprecation, entry.range)
            }
          }

          if (kinds.has('recipes')) {
            reportRecipes(context, inspection, options.recipes)
          }

          if (kinds.has('patterns')) {
            reportPatterns(context, inspection, options.patterns)
          }
        },
      }
    },
  }
}

interface ComponentInspection {
  componentEntries: Array<{ recipe?: string; pattern?: string; range: SourceRange }>
  usages: Array<{ kind: string; name: string; range: SourceRange }>
}

function reportRecipes(
  context: RuleContextWithReport,
  inspection: ComponentInspection,
  recipes: Record<string, Deprecation>,
): void {
  // JSX recipe components carry the resolved recipe name; function calls surface
  // as recipe usages keyed by recipe name.
  reportComponents(
    context,
    'recipe',
    recipes,
    inspection.componentEntries.map((entry) => ({ name: entry.recipe, range: entry.range })),
    inspection.usages.filter((usage) => usage.kind === 'recipe'),
  )
}

function reportPatterns(
  context: RuleContextWithReport,
  inspection: ComponentInspection,
  patterns: Record<string, Deprecation>,
): void {
  reportComponents(
    context,
    'pattern',
    patterns,
    inspection.componentEntries.map((entry) => ({ name: entry.pattern, range: entry.range })),
    inspection.usages.filter((usage) => usage.kind === 'pattern'),
  )
}

function reportComponents(
  context: RuleContextWithReport,
  kind: 'recipe' | 'pattern',
  deprecations: Record<string, Deprecation>,
  fromComponents: Array<{ name?: string; range: SourceRange }>,
  fromUsages: Array<{ name: string; range: SourceRange }>,
): void {
  const seen = new Set<string>()
  const emit = (name: string | undefined, range: SourceRange) => {
    if (!name) return
    const deprecation = deprecations[name]
    if (deprecation === undefined) return
    const key = `${range.start.line}:${range.start.column}`
    if (seen.has(key)) return
    seen.add(key)
    report(context, kind, name, deprecation, range)
  }

  for (const entry of fromComponents) emit(entry.name, entry.range)
  for (const usage of fromUsages) emit(usage.name, usage.range)
}

function report(
  context: RuleContextWithReport,
  kind: 'token' | 'property' | 'recipe' | 'pattern',
  name: string,
  deprecation: Deprecation,
  range: SourceRange,
): void {
  const note = typeof deprecation === 'string' ? ` ${deprecation}` : ''
  context.report({
    messageId: 'deprecated',
    data: { kind, name, note },
    loc: toEslintLoc(range),
  })
}
