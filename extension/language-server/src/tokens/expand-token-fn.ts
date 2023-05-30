import { Token } from './types'

type TokenFnMatch = { token: Token; index: number }
const tokenRegex = /token\(([^)]+)\)/g

/** @see packages/core/src/plugins/expand-token-fn.ts */
export const expandTokenFn = (str: string, fn: (tokenName: string) => Token | undefined) => {
  if (!str.includes('token(')) return []

  const tokens = [] as TokenFnMatch[]
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(str)) != null) {
    match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => {
        const token = fn(s)
        if (token) {
          tokens.push({ token, index: match!.index })
        }
      })
  }

  return tokens
}
