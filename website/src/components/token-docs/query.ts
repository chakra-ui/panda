import preset from '@pandacss/preset-panda'

type TokenValue = {
  value: unknown
  description?: string
}

export type Token = {
  name: string
  path: string[]
  type: string
  value: string
  extensions: {
    category: string
    prop: string
    varRef: string
    pixelValue: string
    isNegative?: boolean
  }
}

const dictionary = flattenTokens(preset.theme.tokens)

const omit = new Set(['black', 'white', 'transparent', 'current'])

export const defaultColors = Object.keys(preset.theme.tokens.colors)
  .filter(key => !omit.has(key))
  .map(key => {
    const values = dictionary.filter(({ type, path }) => type === 'color' && path[1] === key)
    return { key, values }
  })

export const defaultSpacings = dictionary
  .filter(({ extensions }) => extensions.category === 'spacing' && !extensions.isNegative)
  .sort((a, b) => parseFloat(a.value) - parseFloat(b.value))

export const defaultSizings = dictionary
  .filter(
    ({ extensions, value }) =>
      !defaultSpacings.find(s => s.value === value) &&
      extensions.category === 'sizes' &&
      !extensions.isNegative
  )
  .sort((a, b) => parseFloat(a.value) - parseFloat(b.value))

export const defaultBorderRadius = dictionary.filter(({ extensions }) => extensions.category === 'radii')

export const defaultFontSizes = dictionary.filter(({ extensions }) => extensions.category === 'fontSizes')

export const defaultFonts = dictionary.filter(({ extensions }) => extensions.category === 'fonts')

export const defaultBreakpoints = preset.theme.breakpoints

export const defaultShadows = dictionary.filter(({ extensions }) => extensions.category === 'shadows')

export const defaultKeyframes = preset.theme.keyframes

function flattenTokens(tokens: Record<string, unknown>): Token[] {
  return Object.entries(tokens).flatMap(([category, value]) => {
    return collectTokens(value, [category], category)
  })
}

function collectTokens(value: unknown, path: string[], category: string): Token[] {
  if (isTokenValue(value)) {
    const raw = String(value.value)
    return [
      {
        name: path.join('.'),
        path,
        type: categoryToType(category),
        value: raw,
        extensions: {
          category,
          prop: path.slice(1).join('.'),
          varRef: `var(--${path.join('-')})`,
          pixelValue: toPixelValue(raw),
          isNegative: path.at(-1)?.startsWith('-') || raw.startsWith('-')
        }
      }
    ]
  }

  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, child]) => {
    return collectTokens(child, [...path, key], category)
  })
}

function isTokenValue(value: unknown): value is TokenValue {
  return !!value && typeof value === 'object' && 'value' in value
}

function categoryToType(category: string) {
  return category === 'colors' ? 'color' : category
}

function toPixelValue(value: string) {
  const rem = value.match(/^(-?\d*\.?\d+)rem$/)
  if (rem) return `${Number(rem[1]) * 16}px`

  return value
}
