import { calc, toPx } from '@pandacss/shared'
import type { TokenDictionary, TokenMiddleware } from './dictionary'
import { Token, type TokenExtensions } from './token'
import type { ColorPaletteExtensions } from './transform'

export const addNegativeTokens: TokenMiddleware = {
  enforce: 'pre',
  transform(dictionary: TokenDictionary) {
    const { prefix, hash } = dictionary

    const tokens = dictionary.filter({
      extensions: { category: 'spacing' },
    })

    tokens.forEach((token) => {
      //
      const originalPath = [...token.path]
      const originalVar = dictionary.formatCssVar(originalPath, { prefix, hash })

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
        node.name = dictionary.formatTokenName(node.path)
      }

      dictionary.registerToken(node)
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
    const tokens = dictionary.filter({ extensions: { category: 'colors' } })

    const keys = new Map<string, string[]>()
    const colorPalettes = new Map<string, Token[]>()

    tokens.forEach((token) => {
      const { colorPalette, colorPaletteRoots, colorPaletteTokenKeys } =
        token.extensions as TokenExtensions<ColorPaletteExtensions>
      if (!colorPalette) return

      // Add colorPalette keys to the set so we can create virtual tokens for them
      colorPaletteTokenKeys.forEach((keyPath) => {
        keys.set(dictionary.formatTokenName(keyPath), keyPath)
      })

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
      colorPaletteRoots.forEach((colorPaletteRoot) => {
        const formated = dictionary.formatTokenName(colorPaletteRoot)
        const colorPaletteList = colorPalettes.get(formated) || []
        colorPaletteList.push(token)
        colorPalettes.set(formated, colorPaletteList)
        if (token.extensions.isDefault && colorPaletteRoot.length === 1) {
          const keyPath = colorPaletteTokenKeys[0]?.filter(Boolean)
          if (!keyPath.length) return

          const path = colorPaletteRoot.concat(keyPath)
          keys.set(dictionary.formatTokenName(path), [])
        }
      })
    })

    keys.forEach((segments) => {
      const node = new Token({
        name: dictionary.formatTokenName(['colors', 'colorPalette', ...segments].filter(Boolean)),
        value: dictionary.formatTokenName(['colors', 'colorPalette', ...segments].filter(Boolean)),
        path: ['colors', 'colorPalette', ...segments],
      })

      node.setExtensions({
        category: 'colors',
        prop: dictionary.formatTokenName(['colorPalette', ...segments].filter(Boolean)),
        isVirtual: true,
      })

      dictionary.registerToken(node, 'pre')
    })
  },
}

export const removeEmptyTokens: TokenMiddleware = {
  enforce: 'post',
  transform(dictionary: TokenDictionary) {
    dictionary.allTokens = dictionary.allTokens.filter((token) => token.value !== '')
  },
}

export const middlewares = [addNegativeTokens, addVirtualPalette, removeEmptyTokens, addPixelUnit]
