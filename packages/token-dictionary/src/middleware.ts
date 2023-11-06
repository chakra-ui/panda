import { calc, cssVar, toPx } from '@pandacss/shared'
import type { TokenDictionary, TokenMiddleware } from './dictionary'
import { Token } from './token'

export const addNegativeTokens: TokenMiddleware = {
  enforce: 'pre',
  transform(dictionary: TokenDictionary, { prefix, hash }) {
    const tokens = dictionary.filter({
      extensions: { category: 'spacing' },
    })

    tokens.forEach((token) => {
      //
      const originalPath = [...token.path]
      const originalVar = cssVar(originalPath.join('-'), { prefix, hash })

      if (token.value === '0rem') {
        return
      }

      const node = token.clone()
      node.setExtensions({
        isNegative: true,
        prop: `-${token.extensions.prop}`,
        originalPath,
      })

      node.value = calc.negate(originalVar)

      const last = node.path.at(-1)
      if (last != null) {
        node.path[node.path.length - 1] = `-${last}`
      }

      if (node.path) {
        node.name = node.path.join('.')
      }

      dictionary.allTokens.push(node)
    })
  },
}

const units = new Set(['spacing', 'sizes', 'borderWidths', 'fontSizes', 'radii'])

export const addPixelUnit: TokenMiddleware = {
  enforce: 'post',
  transform(dictionary: TokenDictionary) {
    const tokens = dictionary.filter((token) => {
      return units.has(token.extensions.category!) && !token.extensions.isNegative
    })

    tokens.forEach((token) => {
      token.setExtensions({
        pixelValue: toPx(token.value),
      })
    })
  },
}

export const addVirtualPalette: TokenMiddleware = {
  enforce: 'post',
  transform(dictionary: TokenDictionary) {
    const tokens = dictionary.filter({
      extensions: { category: 'colors' },
    })

    const keys = new Set<string>()
    const colorPalettes = new Map<string, Token[]>()

    tokens.forEach((token) => {
      const { colorPalette, colorPaletteRoots, colorPaletteTokenKeys } = token.extensions
      if (!colorPalette) return

      // Add colorPalette keys to the set so we can create virtual tokens for them
      colorPaletteTokenKeys.forEach(keys.add, keys)

      /**
       * Assign nested tokens to their respective color palette list.
       *
       * Iteration 1:
       * If `colorPaletteRoots` is this array ['button']
       * and the token name is 'colors.button.light' it will be added to the 'button' color palette list.
       * ```
       * const colorPalettes = {
       *  'button': ['colors.button.light'],
       * }
       *
       * Itteration 2:
       * If `colorPaletteRoots` is this array ['button', 'button.light']
       * and the token name is 'colors.button.light.accent' it will be added to the 'button' and 'button.light' color palette lists.
       * ```
       * const colorPalettes = {
       * 'button': ['colors.button.light', 'colors.button.light.accent'],
       * 'button.light': ['colors.button.light.accent'],
       * }
       *
       * Itteration 3:
       * If `colorPaletteRoots` is this array ['button', 'button.light', 'button.light.accent']
       * and the token name is 'colors.button.light.accent.secondary' it will be added to the 'button', 'button.light' and 'button.light.accent' color palette lists.
       * ```
       * const colorPalettes = {
       *  'button': ['colors.button.light', 'colors.button.light.accent', 'colors.button.light.accent.secondary'],
       *  'button.light': ['colors.button.light.accent', 'colors.button.light.accent.secondary'],
       *  'button.light.accent': ['colors.button.light.accent.secondary'],
       * }
       */
      colorPaletteRoots.forEach((colorPaletteRoot: string) => {
        const colorPaletteList = colorPalettes.get(colorPaletteRoot) || []
        colorPaletteList.push(token)
        colorPalettes.set(colorPaletteRoot, colorPaletteList)
      })
    })

    keys.forEach((key) => {
      const node = new Token({
        name: ['colors.colorPalette', key].filter(Boolean).join('.'),
        value: ['colors.colorPalette', key].filter(Boolean).join('.'),
        path: ['colors', 'colorPalette', ...key.split('.')],
      })

      node.setExtensions({
        category: 'colors',
        prop: ['colorPalette', key].filter(Boolean).join('.'),
        isVirtual: true,
      })

      dictionary.allTokens.push(node)
    })

    dictionary.transformTokens('pre')
  },
}

export const removeEmptyTokens: TokenMiddleware = {
  enforce: 'post',
  transform(dictionary: TokenDictionary) {
    dictionary.allTokens = dictionary.allTokens.filter((token) => token.value !== '')
  },
}

export const middlewares = [addNegativeTokens, addVirtualPalette, removeEmptyTokens, addPixelUnit]
