import type { Context } from '@pandacss/core'
import outdent from 'outdent'

export function generateConditions(ctx: Context) {
  const staticKeys = Object.keys(ctx.conditions.values)
  const dynamicNames = ctx.conditions.getDynamicConditionNames()
  const dynamicPrefixes = dynamicNames.map((name) => '_' + name)
  const keys = [...staticKeys, ...dynamicPrefixes, 'base']

  const dynamicPrefixesStr = JSON.stringify(dynamicPrefixes)

  return {
    js: outdent`
    ${ctx.file.import('withoutSpace', '../helpers')}

    const conditionsStr = "${staticKeys.join(',')}"
    const conditions = new Set(conditionsStr.split(','))
    const dynamicConditionPrefixes = ${dynamicPrefixesStr}

    const conditionRegex = /^@|&|&$/

    export function isCondition(value){
      return conditions.has(value) || conditionRegex.test(value) || dynamicConditionPrefixes.some(prefix => value === prefix || value.startsWith(prefix + '/'))
    }

    const underscoreRegex = /^_/
    const conditionsSelectorRegex = /&|@/

    export function finalizeConditions(paths){
      return paths.map((path) => {
        if (conditions.has(path) || dynamicConditionPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))){
          return path.replace(underscoreRegex, '')
        }

        if (conditionsSelectorRegex.test(path)){
          return \`[\${withoutSpace(path.trim())}]\`
        }

        return path
      })}

      export function sortConditions(paths){
        return paths.sort((a, b) => {
          const aa = isCondition(a)
          const bb = isCondition(b)
          if (aa && !bb) return 1
          if (!aa && bb) return -1
          return 0
        })
      }
      `,
    dts: outdent`
    ${ctx.file.importType('AnySelector, Selectors', './selectors')}

    export interface Conditions {
    ${keys
      .map(
        (key) =>
          `\t${
            key === 'base'
              ? `/** The base (=no conditions) styles to apply  */\n`
              : ctx.conditions.get(key)
                ? `/** \`${([] as string[]).concat(ctx.conditions.get(key) ?? '').join(' ')}\` */\n`
                : ''
          }\t${JSON.stringify(key)}: string`,
      )
      .join('\n')}
    ${dynamicNames
      .map((name) => `\t\`_${name}/\${string}\`: string`)
      .join('\n')}
    }

    export type ConditionalValue<V> =
      | V
      | Array<V | null>
      | {
          [K in keyof Conditions]?: ConditionalValue<V>
        }

    export type Nested<P> = P & {
      [K in Selectors]?: Nested<P>
    } & {
      [K in AnySelector]?: Nested<P>
    } & {
      [K in keyof Conditions]?: Nested<P>
    }

  `,
  }
}
