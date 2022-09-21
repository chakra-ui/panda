import type { Tokens, SemanticTokens } from '@css-panda/types'
import { match } from 'ts-pattern'
import { getTokenData, TokenData } from './get-token-data'
import { formatBoxShadowValue, parseBoxShadowValue } from './parse-shadow'
import { getSemanticTokenMap, getTokenMap } from './walk-token'

type ObjectEntries<T> = {
  [K in keyof T]: { type: K; values: T[K] }
}[keyof T][]

function* entries<T>(obj: T): IterableIterator<ObjectEntries<T>[number]> {
  for (const key in obj) {
    yield { type: key, values: obj[key] }
  }
}

export function mapTokens(
  tokens: Partial<Tokens>,
  callback: (data: TokenData) => void,
  options: { prefix?: string } = {},
) {
  const { prefix } = options

  for (const entry of entries(tokens)) {
    //
    match(entry)
      .with({ type: 'colors' }, ({ type, values }) => {
        if (!values) return
        getTokenMap(values).forEach((value, key) => {
          callback(getTokenData(type, [key, value], { prefix }))
        })
      })
      .with({ type: 'shadows' }, ({ type, values }) => {
        if (!values) return
        getTokenMap(values).forEach((value, key) => {
          const parsedValue = parseBoxShadowValue(value).map((value) => {
            if (value.valid) value.color = `var(--shadow-color, ${value.color})`
            return value
          })
          callback(getTokenData(type, [key, formatBoxShadowValue(parsedValue)], { prefix }))
        })
      })
      .with({ type: 'spacing' }, ({ type, values }) => {
        if (!values) return
        getTokenMap(values).forEach((value, key) => {
          callback(getTokenData(type, [key, value], { prefix }))
          callback(getTokenData(type, [key, value], { negative: true, prefix }))
        })
      })
      .otherwise((entry: any) => {
        const { type, values } = entry ?? {}
        if (!values) return
        getTokenMap(values).forEach((value, key) => {
          callback(getTokenData(type, [key, value], { prefix }))
        })
      })
  }
}

export function mapSemanticTokens(
  tokens: SemanticTokens,
  callback: (data: TokenData, condition: string) => void,
  options: { prefix?: string } = {},
) {
  const { prefix } = options

  for (const entry of entries(tokens)) {
    //
    const map = getSemanticTokenMap(entry.values as any)

    match(entry)
      .with({ type: 'spacing' }, () => {
        map.forEach((values, condition) => {
          values.forEach((value, key) => {
            // positive
            const data = getTokenData(entry.type, [key, value], { prefix })
            callback(data, condition)

            // negative
            const negativeData = getTokenData(entry.type, [key, value], { negative: true, prefix })
            callback(negativeData, condition)
          })
        })
      })
      .otherwise(() => {
        map.forEach((values, condition) => {
          values.forEach((value, key) => {
            const data = getTokenData(entry.type, [key, value], { prefix })
            callback(data, condition)
          })
        })
      })
  }
}
