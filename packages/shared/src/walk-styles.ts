type Dict = Record<string, any>

export function walkStyles(obj: Dict, fn: (style: Dict, scope?: string[]) => void, scopes: string[] = []) {
  const { selectors = {}, '@media': mediaQueries = {}, '@container': containerQueries = {}, ...baseStyles } = obj

  fn(baseStyles, scopes)

  for (const [selector, selectorStyles] of Object.entries<Dict>(selectors)) {
    walkStyles(selectorStyles, fn, [...scopes, selector])
  }

  for (const [mediaQuery, mediaQueryStyles] of Object.entries<Dict>(mediaQueries)) {
    walkStyles(mediaQueryStyles, fn, [...scopes, `@media ${mediaQuery}`])
  }

  for (const [containerQuery, containerQueryStyles] of Object.entries<Dict>(containerQueries)) {
    walkStyles(containerQueryStyles, fn, [...scopes, `@container ${containerQuery}`])
  }
}
