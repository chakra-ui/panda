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

const colorTokens = dictionary.filter(({ type }) => type === 'color')

const isScale = (key: string) =>
  typeof preset.theme.tokens.colors[key]?.value === 'undefined'

/** Hues with a 50 to 950 scale, in the preset's order: neutrals first, then the hue wheel. */
export const colorScales = Object.keys(preset.theme.tokens.colors)
  .filter(isScale)
  .map(key => ({
    key,
    values: colorTokens.filter(({ path }) => path[1] === key)
  }))

export const colorShades = colorScales[0].values.map(token => token.path[2])

/** Single-value colors worth showing: `black` and `white`. */
export const baseColors = colorTokens.filter(({ path }) =>
  ['black', 'white'].includes(path[1])
)

export const defaultSpacings = dictionary
  .filter(
    ({ extensions }) =>
      extensions.category === 'spacing' && !extensions.isNegative
  )
  .sort((a, b) => parseFloat(a.value) - parseFloat(b.value))

export const defaultSizings = dictionary
  .filter(
    ({ extensions, value }) =>
      !defaultSpacings.find(s => s.value === value) &&
      extensions.category === 'sizes' &&
      !extensions.isNegative
  )
  .sort((a, b) => parseFloat(a.value) - parseFloat(b.value))

export const defaultBorderRadius = dictionary.filter(
  ({ extensions }) => extensions.category === 'radii'
)

export const defaultFontSizes = dictionary.filter(
  ({ extensions }) => extensions.category === 'fontSizes'
)

export const defaultFonts = dictionary.filter(
  ({ extensions }) => extensions.category === 'fonts'
)

export const defaultBreakpoints = preset.theme.breakpoints

export const defaultShadows = dictionary.filter(
  ({ extensions }) => extensions.category === 'shadows'
)

export const defaultKeyframes = preset.theme.keyframes

function flattenTokens(tokens: Record<string, unknown>): Token[] {
  return Object.entries(tokens).flatMap(([category, value]) => {
    return collectTokens(value, [category], category)
  })
}

function collectTokens(
  value: unknown,
  path: string[],
  category: string
): Token[] {
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
          varRef: `var(--${path.join('-').replace(/\./g, '\\.')})`,
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
