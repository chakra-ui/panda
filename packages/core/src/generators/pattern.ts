import { Pattern } from '@css-panda/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export function generatePattern(config: { patterns?: Pattern[] }) {
  const patterns = config.patterns ?? []
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
  }
  `,
  ]

  const dts: string[] = [
    outdent`
  import { UserCssObject, UserConditionalValue } from "../types/public"
  import { Properties } from "../types/csstype"
  import { Tokens } from "../types/token"
  `,
  ]

  patterns.forEach((pattern) => {
    js.push(outdent`
     const ${pattern.name}Transform = getPattern("${pattern.name}").transform
     export const ${pattern.name} = (styles) => css(${pattern.name}Transform(styles))
    `)

    dts.push(outdent`
     export type ${capitalize(pattern.name)}Options = {
        ${Object.keys(pattern.properties ?? {})
          .map((key) => {
            const value = pattern.properties![key]
            return match(value)
              .with({ type: 'cssProp' }, (value) => {
                return `${key}?: UserCssObject["${value.value}"]`
              })
              .with({ type: 'token' }, (value) => {
                if (value.cssProp) {
                  return `${key}?: UserConditionalValue<Tokens["${value.value}"] | Properties["${value.cssProp}"]>`
                }
                return `${key}?: UserConditionalValue<Tokens["${value.value}"]>`
              })
              .with({ type: 'enum' }, (value) => {
                return `${key}?: UserConditionalValue<${value.value.map((t) => JSON.stringify(t)).join(' | ')}>`
              })
              .otherwise(() => {
                return `${key}?: UserConditionalValue<${value.type}>`
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
