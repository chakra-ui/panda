import type { TransformCallback } from 'postcss'

function expandTokenFn(fn?: (str: string) => string | undefined): TransformCallback {
  return (root) => {
    root.walkDecls((decl) => {
      if (decl.value.includes('token(')) {
        const value = decl.value.replace(/token\(([^)]+)\)/g, (_, token) => {
          const [tokenValue, tokenFallback] = token.split(',').map((s: string) => s.trim())
          const result = [tokenValue, tokenFallback].filter(Boolean).map((s) => fn?.(s) ?? s)

          if (result.length > 1) {
            const [a, b] = result
            return a.endsWith(')') ? a.replace(/\)$/, `, ${b})`) : `var(${a}, ${b})`
          }

          return result[0]
        })

        decl.value = value
      }
    })
  }
}

expandTokenFn.postcssPlugin = 'panda:expand-token-fn'

export default expandTokenFn
