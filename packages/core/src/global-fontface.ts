import type { FontfaceRule, GlobalFontface as GlobalFontfaceDefinition } from '@pandacss/types'
import { stringify } from './stringify'

interface GlobalFontfaceOptions {
  globalFontface?: GlobalFontfaceDefinition
}

export class GlobalFontface {
  names: string[]

  constructor(private options: GlobalFontfaceOptions) {
    const { globalFontface = {} } = options
    this.names = Object.keys(globalFontface)
  }

  isEmpty() {
    return this.names.length === 0
  }

  toString() {
    const { globalFontface = {} } = this.options
    return stringifyGlobalFontface(globalFontface)
  }
}

const stringifyGlobalFontface = (globalFontface: GlobalFontfaceDefinition) => {
  if (!globalFontface) return ''

  const lines: string[] = []

  Object.entries(globalFontface).forEach(([key, value]) => {
    const _value = Array.isArray(value) ? value : [value]
    _value.forEach((v) => {
      lines.push(stringifyFontface(key, v))
    })
  })

  return lines.join('\n\n')
}

function stringifyFontface(fontFamily: string, config: FontfaceRule) {
  return `@font-face {
  font-family: ${fontFamily};
  ${stringify(config)}
}`
}
