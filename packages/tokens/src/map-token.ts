import type { SemanticTokens, Tokens } from '@css-panda/types'
import { match } from 'ts-pattern'
import { formatBoxShadowValue, parseBoxShadowValue } from './parse-shadow'
import { TokenData } from './token-data'
import { getSemanticTokenMap, getTokenMap } from './walk-token'

function transform(category: string, value: any): string {
  return match(category)
    .with('shadows', () => {
      if (Array.isArray(value)) {
        value = value.join(',')
      }

      const parsedValue = parseBoxShadowValue(value).map((value) => {
        if (value.valid) {
          value.color = `var(--shadow-color, ${value.color})`
        }
        return value
      })

      return formatBoxShadowValue(parsedValue)
    })

    .with('dropShadows', () => {
      if (Array.isArray(value)) {
        value = value.map((value) => `drop-shadow(${value})`).join(' ')
      }

      return value
    })

    .otherwise(() => {
      if (Array.isArray(value)) {
        value = value.join(', ')
      }

      return value
    })
}

type Options = { prefix?: string }

export function mapTokens(tokens: Partial<Tokens>, fn: (data: TokenData) => void, options: Options = {}) {
  const { prefix } = options

  for (const [category, values] of Object.entries(tokens)) {
    const map = getTokenMap(values)

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

export function mapSemanticTokens(
  tokens: SemanticTokens,
  fn: (data: TokenData, condition: string) => void,
  options: Options = {},
) {
  const { prefix } = options

  for (const [category, values] of Object.entries(tokens)) {
    const map = getSemanticTokenMap(values)

    match(category)
      .with('spacing', () => {
        map.forEach((values, condition) => {
          values.forEach((value, key) => {
            const data = { category, entry: [key, value] } as const

            // positive
            const token = new TokenData(data, { prefix })
            fn(token, condition)

            // negative
            const negToken = new TokenData(data, { negative: true, prefix })
            fn(negToken, condition)
          })
        })
      })
      .otherwise(() => {
        map.forEach((values, condition) => {
          values.forEach((value, key) => {
            const data = { category, entry: [key, transform(category, value)] } as const

            const token = new TokenData(data, { prefix })
            fn(token, condition)
          })
        })
      })
  }
}
