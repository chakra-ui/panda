import { Tokens, TSemanticTokens } from '@css-panda/types'
import { match } from 'ts-pattern'
import { objectEntries } from './entries'
import { getTokenData, TokenData } from './get-token-data'
import { getSemanticTokenMap, getTokenMap } from './token-map'

export function mapTokens(
  tokens: Partial<Tokens>,
  callback: (data: TokenData) => void,
  options: { prefix?: string } = {},
) {
  const { prefix } = options
  for (const entry of objectEntries(tokens)) {
    match(entry)
      .with({ type: 'colors' }, ({ type, values }) => {
        if (!values) return
        getTokenMap(values, { maxDepth: 3 }).forEach((value, key) => {
          callback(getTokenData(type, [key, value], { prefix }))
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
  tokens: TSemanticTokens,
  callback: (data: TokenData, condition: string) => void,
  options: { prefix?: string } = {},
) {
  const { prefix } = options
  for (const entry of objectEntries(tokens)) {
    const map = getSemanticTokenMap(entry.values)
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
