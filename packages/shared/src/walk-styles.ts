type Dict = Record<string, any>

export function walkStyles(obj: Dict, fn: (style: Dict, scope?: string) => void) {
  const { selectors = {}, '@media': mediaQueries = {}, '@container': containerQueries = {}, ...baseStyles } = obj

  fn(baseStyles)

  for (const [scope, scopeStyles] of Object.entries<Dict>(selectors)) {
    fn(scopeStyles, scope)
  }

  for (const [scope, scopeStyles] of Object.entries<Dict>(mediaQueries)) {
    fn(scopeStyles, `@media ${scope}`)
  }

  for (const [scope, scopeStyles] of Object.entries<Dict>(containerQueries)) {
    fn(scopeStyles, `@container ${scope}`)
  }
}
