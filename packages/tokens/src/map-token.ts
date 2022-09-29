import type { SemanticTokens, Tokens } from '@css-panda/types'
import { match } from 'ts-pattern'
import { formatBoxShadowValue, parseBoxShadowValue } from './parse-shadow'
import { TokenData } from './token-data'
import { getSemanticTokenMap, getTokenMap } from './walk-token'

type ObjectEntries<T> = {
  [K in keyof T]: { type: K; values: T[K] }
}[keyof T][]

function* entries<T>(obj: T): IterableIterator<ObjectEntries<T>[number]> {
  for (const key in obj) {
    yield { type: key, values: obj[key] }
  }
}

function transform(type: string, value: any): string {
  return match(type)
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

  for (const entry of entries(tokens)) {
    match(entry)
      .with({ type: 'spacing' }, ({ type, values }) => {
        getTokenMap(values).forEach((value, key) => {
          const data = { category: type, entry: [key, value] } as const
          fn(new TokenData(data, { prefix }))
          fn(new TokenData(data, { negative: true, prefix }))
        })
      })
      .otherwise((entry: any) => {
        const { type, values } = entry
        getTokenMap(values).forEach((value, key) => {
          const data = { category: type, entry: [key, transform(type, value)] } as const
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

  for (const entry of entries(tokens)) {
    const map = getSemanticTokenMap(entry.values)

    match(entry)
      .with({ type: 'spacing' }, () => {
        map.forEach((values, condition) => {
          values.forEach((value, key) => {
            const data = { category: entry.type, entry: [key, value] } as const

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
            const data = {
              category: entry.type,
              entry: [key, transform(entry.type, value)],
            } as const

            const token = new TokenData(data, { prefix })
            fn(token, condition)
          })
        })
      })
  }
}
