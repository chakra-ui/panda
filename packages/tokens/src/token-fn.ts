import { walkObject } from '@css-panda/shared'
import type { PartialTokens } from '@css-panda/types'
import { match } from 'ts-pattern'
import { TokenData } from './token-data'
import { transform } from './transform'

type IterFn = (data: TokenData) => void
type Options = { prefix?: string }

export function createTokenFn(tokens: PartialTokens = {}, options: Options = {}) {
  const { prefix } = options
  return function forEach(fn: IterFn) {
    for (const [category, values] of Object.entries(tokens)) {
      const map = createTokenMap(values)
      match(category)
        .with('spacing', () => {
          map.forEach((value, key) => {
            const data = { category, entry: [key, value] } as const
            fn(new TokenData(data, { prefix }))
            fn(new TokenData(data, { negative: true, prefix }))
          })
        })
        .otherwise(() => {
          map.forEach((value, key) => {
            const data = { category, entry: [key, transform(category, value)] } as const
            fn(new TokenData(data, { prefix }))
          })
        })
    }
  }
}

export function createTokenMap(values: any) {
  const map = new Map<string, string>()

  const walk = (value: string, path: string[]) => {
    map.set(path.join('.'), value)
  }

  walkObject(values, walk, {
    stop: (value) => Array.isArray(value),
  })
  return map
}
