import outdent from 'outdent'
import type { Context } from '../../engines'

export function generateConditions(ctx: Context) {
  const keys = Object.keys(ctx.conditions.values).concat('base')
  return {
    js: outdent`
    ${ctx.file.import('withoutSpace', '../helpers')}

    const conditions = new Set([${keys.map((key) => JSON.stringify(key))}])

    export function isCondition(value){
      return conditions.has(value) || /^@|&|&$/.test(value)
    }

    const underscoreRegex = /^_/
    const selectorRegex = /&|@/

    export function finalizeConditions(paths){
      return paths.map((path) => {
        if (conditions.has(path)){
          return path.replace(underscoreRegex, '')
        }

        if (selectorRegex.test(path)){
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
    import type { AnySelector, Selectors } from './selectors'

    export type Conditions = {
    ${keys.map((key) => `\t${JSON.stringify(key)}: string`).join('\n')}
    }

    export type Condition = keyof Conditions

    export type Conditional<V> =
      | V
      | Array<V | null>
      | {
          [K in keyof Conditions]?: Conditional<V>
        }

    export type ConditionalValue<T> = Conditional<T>

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
