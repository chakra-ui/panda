import { toHash } from './hash'

const escRegex = /[^a-zA-Z0-9_\u0081-\uffff-]/g
const escDashRegex = /[A-Z]/g
function esc(string: string) {
  return string.replace(escRegex, (s) => `\\${s}`).replace(escDashRegex, (match) => `-${match.toLowerCase()}`)
}

export interface CssVar {
  var: `--${string}`
  ref: string
}

export interface CssVarOptions {
  fallback?: string
  prefix?: string
  hash?: boolean
  formatCssVar?: (path: string[]) => string
}

export function cssVar(path: string[], options: CssVarOptions = {}): CssVar {
  const { fallback = '', prefix = '', hash, formatCssVar = (path) => esc(path.join('-')) } = options

  let variable: string | string[] = hash ? [prefix, toHash(path.join('-'))] : [prefix, formatCssVar(path)]

  variable = `--${variable.filter(Boolean).join('-')}`

  const result = {
    var: variable,
    ref: `var(${variable}${fallback ? `, ${fallback}` : ''})`,
  }

  return result as CssVar
}
