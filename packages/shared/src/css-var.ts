import { toHash } from './hash'

const dashRegex = /[^a-zA-Z0-9-.]/g
const dashTrimRegex = /^-+|-+$/
// Hello, 123!?@#$%^&*()  =>  hello-123
function dashCase(string: string) {
  return string.replace(dashRegex, '').replace(dashTrimRegex, '').toLowerCase()
}

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
  formatCssVar?: 'escape' | 'dash'
}

const formatMapping = {
  escape: esc,
  dash: dashCase,
}

export function cssVar(name: string, options: CssVarOptions = {}): CssVar {
  const { fallback = '', prefix = '', hash, formatCssVar = 'escape' } = options

  let variable: string | string[] = hash ? [prefix, toHash(name)] : [prefix, formatMapping[formatCssVar](name)]

  variable = `--${variable.filter(Boolean).join('-')}`

  const result = {
    var: variable,
    ref: `var(${variable}${fallback ? `, ${fallback}` : ''})`,
  }

  return result as CssVar
}
