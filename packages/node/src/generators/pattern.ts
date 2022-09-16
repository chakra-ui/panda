import { extractPatterns } from '@css-panda/ast'
import { capitalize, unionType } from '@css-panda/shared'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../create-context'

const dashCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

export function generatePattern(ctx: Context) {
  const patterns = ctx.config.patterns ?? []

  if (!patterns.length) return

  const extracted = extractPatterns(ctx.conf.code)

  const shared = {
    name: 'shared',
    js: outdent`
    function mapObject(obj, fn) {
      if (typeof obj === 'string') return fn(obj)
      return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]))
    }

    export const helpers = { map: mapObject }
`,
  }

  const files = patterns.map((pattern) => {
    return {
      name: dashCase(pattern.name),
      js: outdent`
      import { helpers } from "./shared"
      import { css } from "../css"

      ${extracted.get(pattern.name)}
      
      const { transform } = ${pattern.name}Fn
      export const ${pattern.name} = (styles) => css(transform(styles, helpers))
      `,

      dts: outdent`
      import { CssObject, ConditionalValue } from "../types"
      import { Properties } from "../types/csstype"
      import { Tokens } from "../types/token"

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
     `,
    }
  })

  // const js = [
  //   outdent`
  // import config from "../config"
  // import { css } from "../css"

  // const patterns = config.patterns ?? []

  // function getPattern(key){
  //   return patterns.find((pattern) => pattern.name === key)
  // }

  // function mapObject(obj, fn) {
  //   if (typeof obj === 'string') return fn(obj)
  //   return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]))
  // }

  // const helpers = { map: mapObject }
  // `,
  // ]

  // const dts: string[] = [
  //   outdent`
  // import { CssObject, ConditionalValue } from "../types"
  // import { Properties } from "../types/csstype"
  // import { Tokens } from "../types/token"
  // `,
  // ]

  // patterns.forEach((pattern) => {
  //   js.push(outdent`
  //    const ${pattern.name}Transform = getPattern("${pattern.name}").transform
  //    export const ${pattern.name} = (styles) => css(${pattern.name}Transform(styles, helpers))
  //   `)

  //   dts.push(outdent`
  //    export type ${capitalize(pattern.name)}Options = {
  //       ${Object.keys(pattern.properties ?? {})
  //         .map((key) => {
  //           const value = pattern.properties![key]
  //           return match(value)
  //             .with({ type: 'cssProp' }, (value) => {
  //               return `${key}?: CssObject["${value.value}"]`
  //             })
  //             .with({ type: 'token' }, (value) => {
  //               if (value.cssProp) {
  //                 return `${key}?: ConditionalValue<Tokens["${value.value}"] | Properties["${value.cssProp}"]>`
  //               }
  //               return `${key}?: ConditionalValue<Tokens["${value.value}"]>`
  //             })
  //             .with({ type: 'enum' }, (value) => {
  //               return `${key}?: ConditionalValue<${unionType(value.value)}>`
  //             })
  //             .otherwise(() => {
  //               return `${key}?: ConditionalValue<${value.type}>`
  //             })
  //         })
  //         .join('\n\t')}
  //    }
  //    export declare function ${pattern.name}(options: ${capitalize(pattern.name)}Options): string
  //   `)
  // })

  return { files, shared }
}
