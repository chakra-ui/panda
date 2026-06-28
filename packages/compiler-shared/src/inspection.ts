import type {
  FileInspectionBatch,
  FileInspectionResult,
  RecipeUsageItem,
  RecipeUsageReport,
  RecipeVariantUsage,
  SourceFileInput,
  StyleEntryRef,
  TokenRawValueUsage,
  TokenSuggestion,
  TokenUsageItem,
  TokenUsageReport,
  UsageReport,
  UsageReportCounts,
  UsageReportFacts,
  UsageReportScope,
  UsageReportScopeOption,
  UsageReportSummary,
  UsageReportViews,
} from './types/extraction'
import type { Spec, SpecRecipe } from './types/output'

const usageScopes: UsageReportScope[] = ['tokens', 'recipes', 'utilities', 'patterns', 'keyframes']

export interface UsageReportOptions {
  scope?: UsageReportScopeOption
  spec?: Spec
  suggestTokens?: (prop: string, value: string) => TokenSuggestion[]
}

/**
 * Adapt the binding's positional source-inspection primitive to the public
 * object-shaped API.
 */
export function inspectFile(
  inspector: { inspectFileSource(path: string, source: string): Omit<FileInspectionResult, 'path'> },
  input: SourceFileInput,
): FileInspectionResult {
  return { ...inspector.inspectFileSource(input.path, input.source), path: input.path }
}

export function inspectFiles(
  inspector: { inspectFileSource(path: string, source: string): Omit<FileInspectionResult, 'path'> },
  files: SourceFileInput[],
): FileInspectionBatch {
  return {
    sourceCount: files.length,
    files: files.map((file) => inspectFile(inspector, file)),
  }
}

export function createUsageReport(inspection: FileInspectionBatch, options: UsageReportOptions = {}): UsageReport {
  const scope = options.scope ?? 'all'
  const summary = createEmptySummary()
  const seen = createSeenSets()
  const facts = createFacts(inspection, options)
  const files: UsageReport['files'] = []

  for (const file of [...inspection.files].sort((a, b) => a.path.localeCompare(b.path))) {
    const counts = createEmptyCounts()

    visitUsage(file, (entry) => {
      if (!includesScope(scope, entry.scope)) return

      counts[entry.scope] += 1
      summary[entry.scope].used += 1
      seen[entry.scope].add(entry.name)
    })

    const sourceUsages = totalUsages(counts)
    if (scope !== 'all' && sourceUsages === 0) continue

    files.push({
      path: file.path,
      counts,
      diagnostics: file.diagnostics.length,
      sourceUsages,
    })
  }

  for (const key of usageScopes) {
    summary[key].unique = seen[key].size
  }

  if (options.spec) {
    applySummaryTotals(summary, options.spec)
  }

  const report: UsageReport = {
    sourceCount: inspection.sourceCount,
    scope,
    summary,
    facts,
    files,
    sourceUsages: files.reduce((total, file) => total + file.sourceUsages, 0),
  }

  if (options.spec) {
    report.views = createUsageViews(facts, options.spec)
  }

  return report
}

function createFacts(inspection: FileInspectionBatch, options: UsageReportOptions): UsageReportFacts {
  const scope = options.scope ?? 'all'
  const spec = options.spec
  const facts = emptyFacts()
  const sortedFiles = [...inspection.files].sort((a, b) => a.path.localeCompare(b.path))
  const fileIds = new Map<string, number>()

  for (const [index, file] of sortedFiles.entries()) {
    fileIds.set(file.path, index)
    facts.files.push({ id: index, path: file.path, diagnostics: file.diagnostics.length })
  }

  if (!spec) return facts

  const tokenIds = addConfiguredTokens(facts, spec, scope)
  const recipeIds = addConfiguredRecipes(facts, spec, scope)
  const rawValueIds = new Map<string, number>()

  for (const file of sortedFiles) {
    const fileId = fileIds.get(file.path)
    if (fileId === undefined) continue

    if (includesScope(scope, 'tokens')) {
      collectTokenFacts(facts, { file, fileId, spec, tokenIds, rawValueIds })
    }

    if (includesScope(scope, 'recipes')) {
      collectRecipeFacts(facts, { file, fileId, spec, recipeIds })
    }
  }

  if (includesScope(scope, 'tokens') && options.suggestTokens) {
    for (const raw of facts.rawValues) {
      for (const suggestion of options.suggestTokens(raw.prop, raw.value)) {
        facts.rawValueSuggestions.push({ rawValueId: raw.id, ...suggestion })
      }
    }
  }

  return facts
}

function collectTokenFacts(
  facts: UsageReportFacts,
  ctx: {
    file: FileInspectionResult
    fileId: number
    spec: Spec
    tokenIds: Map<string, number>
    rawValueIds: Map<string, number>
  },
): void {
  for (const usage of ctx.file.usages) {
    if (usage.kind !== 'token') continue

    const tokenId = getTokenId(facts, ctx.tokenIds, usage.name, false)

    facts.tokenUsages.push({
      fileId: ctx.fileId,
      tokenId,
      line: usage.range.start.line,
      column: usage.range.start.column,
    })
  }

  for (const style of ctx.file.styleEntries) {
    const raw = scalarString(style.sourceValue)
    if (style.kind !== 'utility' || raw === undefined) continue
    if (style.origin === 'generated') continue
    if (hasTokenUsageInside(ctx.file, style)) continue
    if (!style.valueSpans?.some((span) => span.value === raw)) continue

    const prop = canonicalUtilityName(ctx.spec, style)
    const category = ctx.spec.utilities.properties[prop]?.tokenCategory
    if (!category) continue

    const tokenPath = resolveTokenPath(ctx.tokenIds, category, raw)
    if (tokenPath) continue

    const rawValueId = getRawValueId(facts, ctx.rawValueIds, { prop, value: raw, category })
    facts.rawValueUsages.push({
      fileId: ctx.fileId,
      rawValueId,
      line: style.range.start.line,
      column: style.range.start.column,
    })
  }
}

function collectRecipeFacts(
  facts: UsageReportFacts,
  ctx: { file: FileInspectionResult; fileId: number; spec: Spec; recipeIds: Map<string, number> },
): void {
  for (const usage of ctx.file.usages) {
    if (usage.kind !== 'recipe') continue

    const recipeId = getRecipeId(facts, ctx.recipeIds, usage.name, 0, false)

    facts.recipeUsages.push({
      fileId: ctx.fileId,
      recipeId,
      syntax: 'fn',
      line: usage.range.start.line,
      column: usage.range.start.column,
    })
  }

  for (const entry of ctx.file.componentEntries) {
    if (entry.kind !== 'jsx-recipe' && entry.kind !== 'jsx-slot-recipe') continue

    const recipeId = getRecipeId(facts, ctx.recipeIds, entry.recipe ?? entry.name, 0, false)

    facts.recipeUsages.push({
      fileId: ctx.fileId,
      recipeId,
      syntax: 'jsx',
      line: entry.range.start.line,
      column: entry.range.start.column,
    })
  }

  for (const jsx of ctx.file.jsx) {
    const entry = ctx.file.componentEntries.find(
      (item) => item.span.start === jsx.span.start && item.span.end === jsx.span.end,
    )
    const recipe = entry?.recipe
    if (!recipe) continue

    const recipeId = getRecipeId(facts, ctx.recipeIds, recipe, 0, false)
    const recipeSpec = ctx.spec.recipes[recipe] ?? ctx.spec.slotRecipes[recipe]
    if (!recipeSpec) continue

    for (const variant of Object.keys(recipeSpec.variants)) {
      const value = scalarString(jsx.data[variant])
      if (!value) continue

      facts.recipeVariantUsages.push({
        fileId: ctx.fileId,
        recipeId,
        variant,
        value,
        line: jsx.range.start.line,
        column: jsx.range.start.column,
      })
    }
  }

  for (const style of ctx.file.styleEntries) {
    if (style.kind !== 'recipe-variant') continue

    const recipeId = getRecipeId(facts, ctx.recipeIds, style.name, 0, false)
    const variant = variantFromPath(style.path)
    if (!variant) continue

    facts.recipeVariantUsages.push({
      fileId: ctx.fileId,
      recipeId,
      variant: variant.variant,
      value: variant.value,
      line: style.range.start.line,
      column: style.range.start.column,
    })
  }
}

function createUsageViews(facts: UsageReportFacts, spec: Spec): UsageReportViews {
  return {
    tokens: createTokenView(facts, spec),
    recipes: createRecipeView(facts),
  }
}

function applySummaryTotals(summary: UsageReportSummary, spec: Spec) {
  summary.tokens.total = Object.values(spec.tokens.categories).reduce(
    (total, category) => total + category.values.length,
    0,
  )
  summary.recipes.total = Object.keys(spec.recipes).length + Object.keys(spec.slotRecipes).length
  summary.utilities.total = Object.keys(spec.utilities.properties).length
  summary.patterns.total = Object.keys(spec.patterns).length
  summary.keyframes.total = spec.keyframes?.keys.length ?? 0
}

function createTokenView(facts: UsageReportFacts, spec: Spec): TokenUsageReport {
  const tokenById = new Map(facts.tokens.map((token) => [token.id, token]))
  const tokenUses = new Map<number, { uses: number; files: Set<number> }>()

  for (const usage of facts.tokenUsages) {
    addIdCounter(tokenUses, usage.tokenId, usage.fileId)
  }

  const rawUses = new Map<number, { uses: number; files: Set<number> }>()
  for (const usage of facts.rawValueUsages) {
    addIdCounter(rawUses, usage.rawValueId, usage.fileId)
  }

  const suggestionsByRawValue = new Map<number, TokenSuggestion[]>()
  for (const suggestion of facts.rawValueSuggestions) {
    const list = suggestionsByRawValue.get(suggestion.rawValueId) ?? []
    list.push({
      token: suggestion.token,
      semantic: suggestion.semantic,
      conditional: suggestion.conditional,
    })
    suggestionsByRawValue.set(suggestion.rawValueId, list)
  }

  const categoryNames = new Set([
    ...Object.keys(spec.tokens.categories),
    ...facts.tokens.map((token) => token.category),
  ])
  const categories = [...categoryNames]
    .sort()
    .map((category) => {
      const categoryTokenIds = new Set(
        facts.tokens.filter((token) => token.category === category).map((token) => token.id),
      )
      const top = [...tokenUses.entries()]
        .filter(([tokenId]) => categoryTokenIds.has(tokenId))
        .map(([tokenId, usage]): TokenUsageItem => {
          const token = tokenById.get(tokenId)!
          return {
            name: token.path.slice(`${category}.`.length),
            uses: usage.uses,
            files: usage.files.size,
          }
        })
        .sort(compareUsageItems)

      const files = new Set<number>()
      for (const [tokenId, usage] of tokenUses) {
        if (categoryTokenIds.has(tokenId)) {
          for (const file of usage.files) files.add(file)
        }
      }

      const rawValues = facts.rawValues
        .filter((raw) => raw.category === category)
        .map((raw): TokenRawValueUsage | undefined => {
          const usage = rawUses.get(raw.id)
          if (!usage) return undefined

          const suggestions = suggestionsByRawValue.get(raw.id) ?? []
          if (suggestions.length === 0) return undefined

          return {
            prop: raw.prop,
            value: raw.value,
            uses: usage.uses,
            files: usage.files.size,
            suggestions,
          }
        })
        .filter((entry): entry is TokenRawValueUsage => Boolean(entry))
        .sort(compareRawValues)

      const used = top.length
      const total =
        facts.tokens.filter((token) => token.category === category && token.configured).length || categoryTokenIds.size

      return {
        category,
        total,
        used,
        unused: Math.max(total - used, 0),
        percentUsed: percent(used, total),
        files: files.size,
        top,
        rawValues,
      }
    })
    .filter((entry) => entry.used > 0 || entry.rawValues.length > 0)
    .sort((a, b) => b.used - a.used || a.category.localeCompare(b.category))

  return { categories }
}

function createRecipeView(facts: UsageReportFacts): RecipeUsageReport {
  const recipeUses = new Map<number, { files: Set<number>; jsx: number; fn: number }>()
  const variantUses = new Map<number, Map<string, { uses: number; files: Set<number> }>>()

  for (const usage of facts.recipeUsages) {
    const entry = recipeUses.get(usage.recipeId) ?? { files: new Set<number>(), jsx: 0, fn: 0 }
    entry.files.add(usage.fileId)
    entry[usage.syntax] += 1
    recipeUses.set(usage.recipeId, entry)
  }

  for (const usage of facts.recipeVariantUsages) {
    const entry = recipeUses.get(usage.recipeId) ?? { files: new Set<number>(), jsx: 0, fn: 0 }
    entry.files.add(usage.fileId)
    recipeUses.set(usage.recipeId, entry)

    const variants = variantUses.get(usage.recipeId) ?? new Map<string, { uses: number; files: Set<number> }>()
    addCounter(variants, `${usage.variant}.${usage.value}`, usage.fileId)
    variantUses.set(usage.recipeId, variants)
  }

  const recipes: RecipeUsageItem[] = facts.recipes
    .map((recipe) => {
      const usage = recipeUses.get(recipe.id)
      const variants = variantUses.get(recipe.id) ?? new Map()

      if (!usage && variants.size === 0) return undefined

      const top = [...variants.entries()]
        .map(([name, item]): RecipeVariantUsage => ({ name, uses: item.uses, files: item.files.size }))
        .sort(compareUsageItems)
      const usedVariantValues = top.length

      return {
        name: recipe.name,
        totalVariantValues: recipe.totalVariantValues,
        usedVariantValues,
        unusedVariantValues: Math.max(recipe.totalVariantValues - usedVariantValues, 0),
        percentUsed: percent(usedVariantValues, recipe.totalVariantValues),
        files: usage?.files.size ?? 0,
        top,
        usedAs: { jsx: usage?.jsx ?? 0, fn: usage?.fn ?? 0 },
      }
    })
    .filter((entry): entry is RecipeUsageItem => Boolean(entry))
    .sort((a, b) => b.usedVariantValues - a.usedVariantValues || a.name.localeCompare(b.name))

  return { recipes }
}

function visitUsage(
  file: FileInspectionResult,
  visit: (entry: { scope: UsageReportScope; name: string }) => void,
): void {
  for (const usage of file.usages) {
    if (usage.kind === 'token') visit({ scope: 'tokens', name: usage.name })
    if (usage.kind === 'recipe') visit({ scope: 'recipes', name: usage.name })
    if (usage.kind === 'pattern') visit({ scope: 'patterns', name: usage.name })
    if (usage.kind === 'keyframe') visit({ scope: 'keyframes', name: usage.name })
  }

  for (const entry of file.componentEntries) {
    if (entry.kind === 'jsx-recipe' || entry.kind === 'jsx-slot-recipe') {
      visit({ scope: 'recipes', name: entry.recipe ?? entry.name })
    }
    if (entry.kind === 'jsx-pattern') visit({ scope: 'patterns', name: entry.name })
  }

  for (const style of file.styleEntries) {
    if (style.kind === 'utility') visit({ scope: 'utilities', name: style.name })
    if (style.kind === 'pattern-prop') visit({ scope: 'patterns', name: style.name })
    if (style.kind === 'recipe-variant') visit({ scope: 'recipes', name: style.name })
  }
}

function addConfiguredTokens(facts: UsageReportFacts, spec: Spec, scope: UsageReportScopeOption): Map<string, number> {
  const ids = new Map<string, number>()
  if (!includesScope(scope, 'tokens')) return ids

  for (const path of Object.keys(spec.tokens.values).sort()) {
    if (isVirtualToken(path)) continue

    const category = tokenCategory(path)
    if (!category || !spec.tokens.categories[category]) continue

    const id = facts.tokens.length
    ids.set(path, id)
    facts.tokens.push({ id, path, category, configured: true })
  }

  return ids
}

function getTokenId(facts: UsageReportFacts, tokenIds: Map<string, number>, path: string, configured: boolean): number {
  const existing = tokenIds.get(path)
  if (existing !== undefined) return existing

  const id = facts.tokens.length
  tokenIds.set(path, id)
  facts.tokens.push({ id, path, category: tokenCategory(path) ?? 'unknown', configured })
  return id
}

function addConfiguredRecipes(facts: UsageReportFacts, spec: Spec, scope: UsageReportScopeOption): Map<string, number> {
  const ids = new Map<string, number>()
  if (!includesScope(scope, 'recipes')) return ids

  const entries = [...Object.entries(spec.recipes), ...Object.entries(spec.slotRecipes)].sort(([a], [b]) =>
    a.localeCompare(b),
  )

  for (const [name, recipe] of entries) {
    const id = facts.recipes.length
    ids.set(name, id)
    facts.recipes.push({ id, name, totalVariantValues: countRecipeVariantValues(recipe), configured: true })
  }

  return ids
}

function getRecipeId(
  facts: UsageReportFacts,
  recipeIds: Map<string, number>,
  name: string,
  totalVariantValues: number,
  configured: boolean,
): number {
  const existing = recipeIds.get(name)
  if (existing !== undefined) return existing

  const id = facts.recipes.length
  recipeIds.set(name, id)
  facts.recipes.push({ id, name, totalVariantValues, configured })
  return id
}

function getRawValueId(
  facts: UsageReportFacts,
  rawValueIds: Map<string, number>,
  input: { prop: string; value: string; category: string },
): number {
  const key = `${input.category}\0${input.prop}\0${input.value}`
  const existing = rawValueIds.get(key)
  if (existing !== undefined) return existing

  const id = facts.rawValues.length
  rawValueIds.set(key, id)
  facts.rawValues.push({ id, ...input })
  return id
}

function emptyFacts(): UsageReportFacts {
  return {
    files: [],
    tokens: [],
    tokenUsages: [],
    rawValues: [],
    rawValueUsages: [],
    rawValueSuggestions: [],
    recipes: [],
    recipeUsages: [],
    recipeVariantUsages: [],
  }
}

function createEmptyCounts(): UsageReportCounts {
  return { tokens: 0, recipes: 0, utilities: 0, patterns: 0, keyframes: 0 }
}

function createEmptySummary(): UsageReportSummary {
  return Object.fromEntries(usageScopes.map((scope) => [scope, { used: 0, unique: 0 }])) as UsageReportSummary
}

function createSeenSets(): Record<UsageReportScope, Set<string>> {
  return Object.fromEntries(usageScopes.map((scope) => [scope, new Set<string>()])) as Record<
    UsageReportScope,
    Set<string>
  >
}

function totalUsages(counts: UsageReportCounts): number {
  return usageScopes.reduce((total, scope) => total + counts[scope], 0)
}

function includesScope(selected: UsageReportScopeOption, scope: UsageReportScope): boolean {
  return selected === 'all' || selected === scope
}

function addIdCounter(map: Map<number, { uses: number; files: Set<number> }>, key: number, file: number): void {
  const entry = map.get(key)
  if (entry) {
    entry.uses += 1
    entry.files.add(file)
    return
  }

  map.set(key, { uses: 1, files: new Set([file]) })
}

function addCounter(map: Map<string, { uses: number; files: Set<number> }>, key: string, file: number): void {
  const entry = map.get(key)
  if (entry) {
    entry.uses += 1
    entry.files.add(file)
    return
  }

  map.set(key, { uses: 1, files: new Set([file]) })
}

function canonicalUtilityName(spec: Spec, style: StyleEntryRef): string {
  return style.canonicalName ?? spec.utilities.shorthands[style.name] ?? style.name
}

function resolveTokenPath(tokens: Map<string, number>, category: string, value: string): string | undefined {
  if (tokens.has(value)) return value

  const path = `${category}.${value}`
  return tokens.has(path) ? path : undefined
}

function scalarString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function hasTokenUsageInside(file: FileInspectionResult, style: StyleEntryRef): boolean {
  return file.usages.some((usage) => usage.kind === 'token' && containsRange(style.range, usage.range))
}

function containsRange(outer: StyleEntryRef['range'], inner: StyleEntryRef['range']): boolean {
  return comparePosition(outer.start, inner.start) <= 0 && comparePosition(outer.end, inner.end) >= 0
}

function comparePosition(a: StyleEntryRef['range']['start'], b: StyleEntryRef['range']['start']): number {
  return a.line - b.line || a.column - b.column
}

function variantFromPath(path: string[]): { variant: string; value: string } | undefined {
  const variantsIndex = path.indexOf('variants')
  if (variantsIndex === -1) return undefined

  const variant = path[variantsIndex + 1]
  const value = path[variantsIndex + 2]
  return variant && value ? { variant, value } : undefined
}

function countRecipeVariantValues(recipe: SpecRecipe | undefined): number {
  if (!recipe) return 0
  return Object.values(recipe.variants).reduce((total, variant) => total + variant.values.length, 0)
}

function tokenCategory(path: string): string | undefined {
  const index = path.indexOf('.')
  return index === -1 ? undefined : path.slice(0, index)
}

function isVirtualToken(path: string): boolean {
  return path.split('.').includes('colorPalette')
}

function percent(used: number, total: number): number {
  if (total === 0) return 0
  return Math.round((used / total) * 10_000) / 100
}

function compareUsageItems(a: TokenUsageItem | RecipeVariantUsage, b: TokenUsageItem | RecipeVariantUsage): number {
  return b.uses - a.uses || b.files - a.files || a.name.localeCompare(b.name)
}

function compareRawValues(a: TokenRawValueUsage, b: TokenRawValueUsage): number {
  return b.uses - a.uses || b.files - a.files || a.prop.localeCompare(b.prop) || a.value.localeCompare(b.value)
}
