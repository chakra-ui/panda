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
      const { colorPalette } = token.extensions
      if (!colorPalette) return
      const colorPaletteRoot = colorPalette.split('.').shift()
      token.path
        .slice(token.path.indexOf(colorPaletteRoot) + 1)
        .reduce((acc, _, i, arr) => {
          acc.push(arr.slice(0, i + 1).join('.'))
          return acc
        }, [] as string[])
        .forEach((key) => keys.add(key))

      const list = colorPalettes.get(colorPalette) || []
      keys.add(token.path.at(-1) as string)
      list.push(token)
      colorPalettes.set(colorPalette, list)
    })

    keys.forEach((key) => {
      const node = new Token({
        name: `colors.colorPalette.${key}`,
        value: `{colors.colorPalette.${key}}`,
        path: ['colors', 'colorPalette', ...key.split('.')],
      })

      node.setExtensions({
        category: 'colors',
        prop: `colorPalette.${key}`,
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
