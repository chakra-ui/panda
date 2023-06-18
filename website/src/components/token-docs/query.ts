import preset from '@pandacss/preset-panda'
import { TokenDictionary } from '@pandacss/token-dictionary'

const dictionary = new TokenDictionary({
  tokens: preset.theme.tokens
})

const omit = new Set(['black', 'white', 'transparent', 'current'])

export const defaultColors = Object.keys(preset.theme.tokens.colors)
  .filter(key => !omit.has(key))
  .map(key => {
    const values = dictionary.filter(
      ({ type, path }) => type === 'color' && path[1] === key
    )
    return { key, values }
  })

export const defaultSpacings = dictionary
  .filter(
    ({ extensions }) =>
      extensions.category === 'spacing' && !extensions.isNegative
  )
  .sort((a, b) => parseFloat(a.value) - parseFloat(b.value))

export const defaultBorderRadius = dictionary.filter({
  extensions: { category: 'radii' }
})

export const defaultFontSizes = dictionary.filter({
  extensions: { category: 'fontSizes' }
})

export const defaultFonts = dictionary.filter({
  extensions: { category: 'fonts' }
})

export const defaultBreakpoints = preset.theme.breakpoints

export const defaultShadows = dictionary.filter({
  extensions: { category: 'shadows' }
})

export const defaultKeyframes = preset.theme.keyframes
