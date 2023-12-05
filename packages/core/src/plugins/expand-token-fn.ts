import { esc } from '@pandacss/shared'
import type { Token } from '@pandacss/types'
import type { TransformCallback } from 'postcss'

const tokenRegex = /token\(([^)]+)\)/g
const closingParenthesisRegex = /\)$/

const expandToken = (
  str: string,
  replacer: (a: string, b?: string) => string,
  getterFn?: (str: string) => string | undefined,
): string => {
  const value = str.replace(tokenRegex, (_, token) => {
    const [tokenValue, tokenFallback] = token.split(',').map((s: string) => s.trim())
    const result = [tokenValue, tokenFallback].filter(Boolean).map((s) => getterFn?.(s) ?? esc(s))

    if (result.length > 1) {
      const [a, b] = result
      return replacer(a, b)
    }

    return replacer(result[0])
  })

  return value
}

const tokenReplacer = (a: string, b?: string) =>
  b ? (a.endsWith(')') ? a.replace(closingParenthesisRegex, `, ${b})`) : `var(${a}, ${b})`) : a
const atRuleReplace = (a: string, b?: string) => a ?? b

function expandTokenFn(
  tokenFn?: (key: string) => string,
  rawTokenFn?: (path: string) => Token | undefined,
): TransformCallback {
  return (root) => {
    root.walk((node) => {
      if (node.type === 'decl' && node.value.includes('token(')) {
        node.value = expandToken(node.value, tokenReplacer, tokenFn)
        return
      }
      if (node.type === 'atrule' && node.params.includes('token(')) {
        node.params = expandToken(node.params, atRuleReplace, (path: string) => rawTokenFn?.(path)?.value)
      }
      if (node.type === 'rule' && node.selector.includes('token(')) {
        node.selector = expandToken(node.selector, atRuleReplace, (path: string) => rawTokenFn?.(path)?.value)
      }
    })
  }
}

expandTokenFn.postcssPlugin = 'panda:expand-token-fn'

export default expandTokenFn
