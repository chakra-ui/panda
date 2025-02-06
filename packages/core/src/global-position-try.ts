import type { FontfaceRule, GlobalPositionTry as GlobalPositionTryDefinition } from '@pandacss/types'
import { stringify } from './stringify'

interface GlobalFontfaceOptions {
  globalPositionTry?: GlobalPositionTryDefinition
}

export class GlobalPositionTry {
  names: string[]

  constructor(private opts: GlobalFontfaceOptions) {
    this.names = Object.keys(opts.globalPositionTry ?? {})
  }

  isEmpty() {
    return this.names.length === 0
  }

  toString() {
    return stringifyGlobalPositionTry(this.opts.globalPositionTry ?? {})
  }
}

const stringifyGlobalPositionTry = (dfns: GlobalPositionTryDefinition) => {
  if (!dfns) return ''

  const lines: string[] = []

  Object.entries(dfns).forEach(([key, value]) => {
    const _value = Array.isArray(value) ? value : [value]
    _value.forEach((v) => {
      lines.push(stringifyPositionTry(key, v))
    })
  })

  return lines.join('\n\n')
}

const ident = (key: string) => (key.startsWith('--') ? key : `--${key}`)

function stringifyPositionTry(key: string, config: FontfaceRule) {
  return `@position-try ${ident(key)} {
  ${stringify(config)}
}`
}
