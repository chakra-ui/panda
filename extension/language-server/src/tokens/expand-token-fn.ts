import { type Token } from '@pandacss/token-dictionary'

type TokenFnMatch = { token: Token; index: number }
const tokenRegex = /token\(([^)]+)\)/g

const matchToken = (str: string, callback: (tokenPath: string, match: RegExpExecArray) => void) => {
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(str)) != null) {
    match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((str) => callback(str, match!))
  }
}

/** @see packages/core/src/plugins/expand-token-fn.ts */
export const expandTokenFn = (str: string, fn: (tokenName: string) => Token | undefined) => {
  if (!str.includes('token(')) return []

  const tokens = [] as TokenFnMatch[]
  matchToken(str, (tokenPath, match) => {
    const token = fn(tokenPath)
    if (token) {
      tokens.push({ token, index: match.index })
    }
  })

  return tokens
}

export const extractTokenPaths = (str: string) => {
  if (!str.includes('token(')) return []

  const paths = [] as string[]

  matchToken(str, (tokenPath) => {
    paths.push(tokenPath)
  })

  return paths
}
