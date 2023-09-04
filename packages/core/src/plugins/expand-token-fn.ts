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
    const result = [tokenValue, tokenFallback]
      .filter(Boolean)
      .map((s) => getterFn?.(s) ?? (s.includes('.') ? `'${s}'` : s))

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

function expandTokenFn(fn?: (str: string) => string | undefined): TransformCallback {
  return (root) => {
    root.walk((node) => {
      if (node.type === 'decl' && node.value.includes('token(')) {
        node.value = expandToken(node.value, tokenReplacer, fn)
        return
      }
      if (node.type === 'atrule' && node.params.includes('token(')) {
        node.params = expandToken(node.params, atRuleReplace, fn)
      }
    })
  }
}

expandTokenFn.postcssPlugin = 'panda:expand-token-fn'

export default expandTokenFn
