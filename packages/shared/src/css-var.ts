import { toHash } from './hash'

const escRegex = /[.*+?^${}()|[\]\\/]/g
function esc(string: string) {
  return string.replace(escRegex, '\\$&')
}

const dashCaseRegex = /[A-Z]/g
function dashCase(string: string) {
  return string.replace(dashCaseRegex, (match) => `-${match.toLowerCase()}`)
}

export type CssVar = {
  var: `--${string}`
  ref: string
}

export type CssVarOptions = {
  fallback?: string
  prefix?: string
  hash?: boolean
}

export function cssVar(name: string, options: CssVarOptions = {}): CssVar {
  const { fallback = '', prefix = '', hash } = options

  const variable = hash
    ? ['-', prefix, toHash(name)].filter(Boolean).join('-')
    : dashCase(['-', prefix, esc(name)].filter(Boolean).join('-'))

  const result = {
    var: variable,
    ref: `var(${variable}${fallback ? `, ${fallback}` : ''})`,
  }

  return result as CssVar
}
