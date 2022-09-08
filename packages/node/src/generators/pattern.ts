import { unionType, capitalize } from '@css-panda/shared'
import type { Pattern } from '@css-panda/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'

export function generatePattern(config: { patterns?: Pattern[] }) {
  const patterns = config.patterns ?? []
  if (!patterns.length) return
  const js = [
    outdent`
  import config from "../config"
  import { css } from "../css"
  
  const cache = new Map()
  
  const getPattern = (key) => {
    if (cache.has(key)) return cache.get(key)
    const pattern = config.patterns.find(p => p.name === key)
    if (!pattern) throw new Error(\`Pattern \${key} not found\`)
    cache.set(key, pattern)
    return pattern
  }

  function mapObject(obj, fn) {
    if (typeof obj === 'string') return fn(obj)
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]))
  }

  const helpers = { map: mapObject }
  `,
  ]

  const dts: string[] = [
    outdent`
  import { CssObject, ConditionalValue } from "../types/public"
  import { Properties } from "../types/csstype"
  import { Tokens } from "../types/token"
  `,
  ]

  patterns.forEach((pattern) => {
    js.push(outdent`
     const ${pattern.name}Transform = getPattern("${pattern.name}").transform
     export const ${pattern.name} = (styles) => css(${pattern.name}Transform(styles, helpers))
    `)

    dts.push(outdent`
     export type ${capitalize(pattern.name)}Options = {
        ${Object.keys(pattern.properties ?? {})
          .map((key) => {
            const value = pattern.properties![key]
            return match(value)
              .with({ type: 'cssProp' }, (value) => {
                return `${key}?: CssObject["${value.value}"]`
              })
              .with({ type: 'token' }, (value) => {
                if (value.cssProp) {
                  return `${key}?: ConditionalValue<Tokens["${value.value}"] | Properties["${value.cssProp}"]>`
                }
                return `${key}?: ConditionalValue<Tokens["${value.value}"]>`
              })
              .with({ type: 'enum' }, (value) => {
                return `${key}?: ConditionalValue<${unionType(value.value)}>`
              })
              .otherwise(() => {
                return `${key}?: ConditionalValue<${value.type}>`
              })
          })
          .join('\n\t')}
     }
     export declare function ${pattern.name}(options: ${capitalize(pattern.name)}Options): string
    `)
  })

  return {
    js: js.join('\n\n'),
    dts: dts.join('\n\n'),
  }
}
