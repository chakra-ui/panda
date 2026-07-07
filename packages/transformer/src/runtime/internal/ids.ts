/** Transformed source imports — mirrors styled-system/css surface. */
export const INTERNAL_CSS_IMPORT = '@pandacss-internal/css'
export const INTERNAL_CSS_RESOLVED_ID = '\0pandacss:internal:css'

export function isInternalCssImport(id: string): boolean {
  return id === INTERNAL_CSS_IMPORT
}

export function isInternalCssResolvedId(id: string): boolean {
  return id === INTERNAL_CSS_RESOLVED_ID
}
