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
  return {
    cssType: getType('csstype.d.ts'),
    pandaCssType: getType('system-types.d.ts'),
    publicType: outdent`
    import * as System from './system-types'
    import { PropTypes } from './prop-type'
    import { Conditions } from './conditions'
    
    export type SystemStyleObject = System.StyleObject<Conditions, PropTypes${strict ? ', true' : ''}>
    export type GlobalStyleObject = System.GlobalStyleObject<Conditions, PropTypes${strict ? ', true' : ''}>
    export type JSXStyleProperties = System.JSXStyleProperties<Conditions, PropTypes${strict ? ', true' : ''}>

    export type ConditionalValue<T> = System.Conditional<Conditions, T>
    export type Assign<T, U> = Omit<T, keyof U> & U
    `,
  }
}
