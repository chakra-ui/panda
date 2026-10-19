import type { DesignSystemIndex, DesignSystemValue } from '~/utils/design-system'

export type SearchKind =
  | 'category'
  | 'token'
  | 'textStyle'
  | 'layerStyle'
  | 'animationStyle'
  | 'recipe'
  | 'slotRecipe'
  | 'pattern'
  | 'condition'
  | 'theme'
  | 'keyframe'
  | 'colorPalette'

export const KIND_LABELS: Record<SearchKind, string> = {
  category: 'Categories',
  token: 'Tokens',
  textStyle: 'Text styles',
  layerStyle: 'Layer styles',
  animationStyle: 'Animation styles',
  recipe: 'Recipes',
  slotRecipe: 'Slot recipes',
  pattern: 'Patterns',
  condition: 'Conditions',
  theme: 'Themes',
  keyframe: 'Keyframes',
  colorPalette: 'Color palettes',
}

interface Field {
  label: string
  text: string
  lower: string
}

export interface SearchEntry {
  id: string
  kind: SearchKind
  label: string
  category?: string
  path?: string
  color?: string
  fields: Field[]
}

export interface SearchHit {
  entry: SearchEntry
  match?: { label: string; text: string }
  score: number
}

const field = (label: string, text: unknown): Field | null => {
  if (text == null || text === '') return null
  const value = typeof text === 'string' ? text : JSON.stringify(text)
  return { label, text: value, lower: value.toLowerCase() }
}

const entry = (
  kind: SearchKind,
  label: string,
  fields: (Field | null)[],
  extra: Partial<SearchEntry> = {},
): SearchEntry => ({
  id: `${kind}:${label}`,
  kind,
  label,
  fields: [field('name', label)!, ...fields.filter((f): f is Field => f !== null)],
  ...extra,
})

const unique = (values: (string | undefined)[]) => [...new Set(values.filter(Boolean))]

function valueLabel(row: DesignSystemValue): string {
  const parts = [row.theme && `${row.theme} theme`, row.condition].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'value'
}

function tokenEntries(ds: DesignSystemIndex): SearchEntry[] {
  return ds.spec.paths.map((path) => {
    const token = ds.token(path)!
    const rows = ds.valuesFor(path)
    const base = rows.find((row) => !row.condition && !row.theme)
    return entry(
      'token',
      path,
      [
        ...rows.map((row) => field(valueLabel(row), row.value)),
        ...rows.flatMap((row) => row.refs ?? []).map((ref) => field('references', ref)),
        field('themes', unique(rows.map((row) => row.theme)).join(', ')),
        field('conditions', unique(rows.map((row) => row.condition)).join(', ')),
        field('css variable', token.cssVar),
        field('original value', token.originalValue),
        field('description', token.description),
        field('deprecated', token.deprecatedReason),
      ],
      {
        category: token.category,
        path,
        color: token.category === 'colors' ? base?.value : undefined,
      },
    )
  })
}

function styleEntries(ds: DesignSystemIndex): SearchEntry[] {
  const kinds = [
    ['textStyle', 'textStyles'],
    ['layerStyle', 'layerStyles'],
    ['animationStyle', 'animationStyles'],
  ] as const
  return kinds.flatMap(([kind, key]) =>
    Object.entries(ds.composition(key)).map(([name, style]) =>
      entry(kind, name, [field('description', style.description)]),
    ),
  )
}

function recipeEntries(ds: DesignSystemIndex): SearchEntry[] {
  const recipes = Object.entries(ds.recipes()).map(([name, recipe]) => ['recipe', name, recipe] as const)
  const slotRecipes = Object.entries(ds.slotRecipes()).map(([name, recipe]) => ['slotRecipe', name, recipe] as const)
  return [...recipes, ...slotRecipes].map(([kind, name, recipe]) =>
    entry(kind, name, [
      field('class name', recipe.className),
      field('description', recipe.description),
      ...Object.entries(recipe.variants).map(([variant, { values }]) => field(`variant ${variant}`, values.join(', '))),
      'slots' in recipe ? field('slots', recipe.slots.join(', ')) : null,
    ]),
  )
}

function patternEntries(ds: DesignSystemIndex): SearchEntry[] {
  return Object.entries(ds.patterns()).map(([name, pattern]) =>
    entry('pattern', name, [
      field('jsx', [pattern.jsxName, ...(pattern.jsx ?? [])].join(', ')),
      field('description', pattern.description),
      field('properties', Object.keys(pattern.properties).join(', ')),
    ]),
  )
}

export function buildSearchIndex(ds: DesignSystemIndex): SearchEntry[] {
  const { spec } = ds
  return [
    ...ds.categories().map((category) =>
      entry('category', category, [field('tokens', `${ds.categoryPaths(category).length} tokens`)], {
        category,
      }),
    ),
    ...tokenEntries(ds),
    ...styleEntries(ds),
    ...recipeEntries(ds),
    ...patternEntries(ds),
    ...Object.entries(spec.conditions).map(([name, query]) => entry('condition', name, [field('query', query)])),
    ...Object.entries(spec.themes).map(([name, theme]) =>
      entry('theme', name, [field('selector', theme.selector), field('id', theme.id)]),
    ),
    ...ds.keyframes().map((name) => entry('keyframe', name, [])),
    ...ds.colorPalettes().map((name) => entry('colorPalette', name, [])),
  ]
}

function scoreLabel(label: string, query: string): number {
  if (label === query) return 100
  if (label.startsWith(query)) return 80
  const at = label.indexOf(query)
  if (at === -1) return 0
  // A match at a segment boundary (`blue.500` in `colors.blue.500`) beats one mid-word.
  return /[._\-/\s]/.test(label[at - 1] ?? '') ? 70 : 60
}

export function searchDesignSystem(entries: SearchEntry[], query: string, limit = 60): SearchHit[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  const terms = needle.split(/\s+/)
  const hits: SearchHit[] = []

  for (const item of entries) {
    const label = item.fields[0].lower
    if (!terms.every((term) => item.fields.some((f) => f.lower.includes(term)))) continue

    const labelScore = scoreLabel(label, needle)
    if (labelScore) {
      hits.push({ entry: item, score: labelScore })
      continue
    }
    const missing = terms.filter((term) => !label.includes(term))
    const other = missing.length
      ? item.fields.slice(1).find((f) => missing.some((term) => f.lower.includes(term)))
      : undefined
    hits.push({
      entry: item,
      match: other && { label: other.label, text: other.text },
      score: missing.length ? 30 : 50,
    })
  }

  return hits.sort((a, b) => b.score - a.score || a.entry.label.length - b.entry.label.length).slice(0, limit)
}

export function excerpt(text: string, query: string, lead = 16): string {
  const term = query.trim().toLowerCase().split(/\s+/)[0] ?? ''
  const at = term ? text.toLowerCase().indexOf(term) : -1
  return at > lead ? `…${text.slice(at - lead)}` : text
}
