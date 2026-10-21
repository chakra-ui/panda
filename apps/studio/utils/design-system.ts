import {
  indexDesignSystem,
  parseDesignSystem,
  type DesignSystemIndex,
  type DesignSystemSpec,
  type DesignSystemValue,
  type TokenView,
} from '@pandacss/compiler-shared'

export type { DesignSystemIndex, DesignSystemSpec, DesignSystemValue, TokenView }

export type ParseResult = { ok: true; spec: DesignSystemSpec } | { ok: false; error: string }

export function parseSpec(raw: string): ParseResult {
  const result = parseDesignSystem(raw)
  if (!result.ok) {
    return {
      ok: false,
      error: `${result.error} Drop the styled-system/specs/design-system.json that panda codegen --spec writes.`,
    }
  }
  if (!result.value.paths.length) {
    return { ok: false, error: 'That design system has no tokens.' }
  }
  return { ok: true, spec: result.value }
}

export const index = indexDesignSystem

/** Themes the system defines. An exclusive choice, so a select fits. */
export function themeNames(ds: DesignSystemIndex): string[] {
  return Object.keys(ds.spec.themes)
}

/** How to draw a category. Purely a studio concern — not part of the spec. */
export type Renderer =
  | 'colors'
  | 'scale'
  | 'fonts'
  | 'ramp'
  | 'box'
  | 'motion'
  | 'ratio'
  | 'blur'
  | 'opacity'
  | 'layers'
  | 'screens'
  | 'table'

const RENDERER_BY_CATEGORY: Record<string, Renderer> = {
  colors: 'colors',
  gradients: 'colors',
  spacing: 'scale',
  sizes: 'scale',
  radii: 'scale',
  fonts: 'fonts',
  fontSizes: 'ramp',
  lineHeights: 'ramp',
  letterSpacings: 'ramp',
  fontWeights: 'ramp',
  shadows: 'box',
  borders: 'box',
  durations: 'motion',
  easings: 'motion',
  animations: 'motion',
  aspectRatios: 'ratio',
  blurs: 'blur',
  opacity: 'opacity',
  zIndex: 'layers',
  breakpoints: 'screens',
}

export function rendererFor(category: string): Renderer {
  return RENDERER_BY_CATEGORY[category] ?? 'table'
}

/** Numeric ordering for scales, where `4` must precede `10`. */
export function toNumber(value: string): number {
  const match = value.match(/-?\d*\.?\d+/)
  if (!match) return Number.POSITIVE_INFINITY
  const n = Number.parseFloat(match[0])
  if (/rem|em/.test(value)) return n * 16
  return n
}

/** Categories whose tokens only read against real copy, and the copy to use. */
export const PREVIEW_TEXT: Record<string, string> = {
  fonts: 'The quick brown fox jumps over the lazy dog',
  fontSizes: 'Almost before we knew it, we had left the ground.',
  fontWeights: 'The quick brown fox jumps over the lazy dog',
  // Tracking only reads across a full alphabet.
  letterSpacings: 'The quick brown fox jumps over the lazy dog.',
  // Leading is invisible on a single line.
  lineHeights:
    'Line height sets the vertical distance between lines of text. It only shows itself across a few lines, so this paragraph runs on a while to give it room.',
}

export const hasPreview = (category: string) => category in PREVIEW_TEXT

/** Leading needs several lines, so it gets a textarea rather than an input. */
export const wantsLargePreview = (category: string) => category === 'lineHeights'

/** The spec only flags semantic tokens that reference another token; one that varies by condition or theme is semantic too. */
export function isSemantic(ds: DesignSystemIndex, token: TokenView): boolean {
  return !!token.semantic || ds.valuesFor(token.path).some((row) => row.condition || row.theme)
}

export interface ColorGroup {
  name: string
  tokens: { token: TokenView; label: string }[]
}

/** Groups by everything before the last dot: `fg.muted` joins `fg`, `blue.500` joins `blue`, a `DEFAULT` `fg` leads `fg`. */
export function groupColors(tokens: TokenView[]): ColorGroup[] {
  const prefixes = new Set(tokens.map((t) => t.name.slice(0, Math.max(t.name.lastIndexOf('.'), 0))))
  const groups = new Map<string, ColorGroup>()
  for (const token of tokens) {
    const dot = token.name.lastIndexOf('.')
    const isDefault = dot === -1 && prefixes.has(token.name)
    const name = isDefault ? token.name : dot === -1 ? 'base' : token.name.slice(0, dot)
    const group = groups.get(name) ?? { name, tokens: [] }
    group.tokens.push({ token, label: isDefault ? 'DEFAULT' : token.name.slice(dot + 1) })
    groups.set(name, group)
  }
  return [...groups.values()]
}

const NAMED_WEIGHTS: Record<string, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
}

function sortKey(category: string, value: string): number | undefined {
  const trimmed = value.trim().toLowerCase()
  if (category === 'fontWeights' && trimmed in NAMED_WEIGHTS) return NAMED_WEIGHTS[trimmed]
  if (!/^-?[\d.]+(px|rem|em|%)?$/.test(trimmed)) return undefined
  return toNumber(trimmed)
}

/** Ascending by value. Values that aren't plain numbers (`clamp()`, `var()`) keep their order, last. */
export function sortTypeTokens(category: string, tokens: TokenView[]): TokenView[] {
  const keyed = tokens.map((token, index) => ({ token, index, key: sortKey(category, token.value) }))
  return keyed
    .toSorted((a, b) => {
      if (a.key === undefined || b.key === undefined) {
        return a.key === undefined && b.key === undefined ? a.index - b.index : a.key === undefined ? 1 : -1
      }
      return a.key - b.key || a.index - b.index
    })
    .map((entry) => entry.token)
}

export function toPixels(value: string): number | undefined {
  const match = value.trim().match(/^(-?[\d.]+)(px|rem)$/)
  if (!match) return undefined
  const n = Number(match[1])
  return match[2] === 'rem' ? n * 16 : n
}

const CATEGORY_ORDER = [
  'colors',
  'gradients',
  'fonts',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacings',
  'spacing',
  'sizes',
  'radii',
  'borders',
  'borderWidths',
  'shadows',
  'blurs',
  'opacity',
  'durations',
  'easings',
  'animations',
  'breakpoints',
  'zIndex',
  'aspectRatios',
  'cursor',
]

/** Fixed order by purpose, the same for every system; categories Studio doesn't know follow, A–Z. */
export function orderCategories<T extends { type: string }>(items: T[]): T[] {
  const rank = (type: string) => {
    const index = CATEGORY_ORDER.indexOf(type)
    return index === -1 ? CATEGORY_ORDER.length : index
  }
  return items.toSorted((a, b) => rank(a.type) - rank(b.type) || a.type.localeCompare(b.type))
}

/** Studio's own root font size isn't 16px, so specimens rebase `rem` to the 16px the system was designed for. */
export const remToPx = (value: string) => value.replace(/(-?\d*\.?\d+)rem\b/g, (_, n) => `${Number(n) * 16}px`)

export const aliasOf = (token: { originalValue?: string }) => token.originalValue?.match(/^\{([^}]+)\}$/)?.[1]

/** Condition states shown on a dark tile, so dark-mode values stay visible. */
export const isDarkCondition = (condition?: string) => !!condition && /dark/i.test(condition)
