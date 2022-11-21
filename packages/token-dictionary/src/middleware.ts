import { calc, cssVar } from '@pandacss/shared'
import type { TokenDictionary, TokenMiddleware } from './dictionary'
import { Token } from './token'

export const addNegativeTokens: TokenMiddleware = {
  enforce: 'pre',
  transform(dictionary: TokenDictionary, { prefix }) {
    const tokens = dictionary.filter({
      extensions: { category: 'spacing' },
    })

    tokens.forEach((token) => {
      //
      const originalPath = [...token.path]
      const originalVar = cssVar(originalPath.join('-'), { prefix })

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

export const addVirtualPalette: TokenMiddleware = {
  enforce: 'post',
  transform(dictionary: TokenDictionary) {
    const tokens = dictionary.filter({
      extensions: { category: 'colors' },
    })

    const keys = new Set<string>()
    const palettes = new Map<string, Token[]>()

    tokens.forEach((token) => {
      const palette = token.extensions.palette
      if (!palette) return
      const list = palettes.get(palette) || []
      keys.add(token.path.at(-1) as string)
      list.push(token)
      palettes.set(palette, list)
    })

    keys.forEach((key) => {
      const node = new Token({
        name: `colors.palette.${key}`,
        value: `{colors.palette.${key}}`,
        path: ['colors', 'palette', key],
      })

      node.setExtensions({
        category: 'colors',
        prop: `palette.${key}`,
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

export const middlewares = [addNegativeTokens, addVirtualPalette, removeEmptyTokens]
