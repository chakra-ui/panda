import { readFileSync } from 'fs-extra'
import outdent from 'outdent'
import type { PandaContext } from '../context'
import { getEntrypoint } from './get-entrypoint'

function getType(file: string) {
  const filepath = getEntrypoint('@pandacss/types', { dev: file })
  return readFileSync(filepath, 'utf8')
}

export function generateCssType(ctx: PandaContext) {
  const strict = ctx.strictTokens
  const strictArg = strict ? 'true' : 'false'
  return {
    cssType: getType('csstype.d.ts'),
    pandaCssType: getType('system-types.d.ts'),
    publicType: outdent`
    import * as System from './system-types'
    import { PropTypes } from './prop-type'
    import { Conditions } from './conditions'
    
    export type SystemStyleObject<Overrides = {}> = System.StyleObject<Conditions, PropTypes, ${strictArg}, Overrides>
    export type GlobalStyleObject<Overrides = {}> = System.GlobalStyleObject<Conditions, PropTypes, ${strictArg}, Overrides>
    export type JsxStyleProps<Overrides = {}> = System.JsxStyleProps<Conditions, PropTypes, ${strictArg}, Overrides>
    export type ConditionalValue<Value> = System.Conditional<Conditions, Value>

    type DistributiveOmit<T, U> = T extends any ? Pick<T, Exclude<keyof T, U>> : never
    export type Assign<Target, Override> = DistributiveOmit<Target, keyof Override> & Override
    `,
  }
}
