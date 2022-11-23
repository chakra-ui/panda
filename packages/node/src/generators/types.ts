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
    import { StyleObject, Conditional, ConditionCssProperties } from './system-types'
    import { PropTypes } from './prop-type'
    import { Conditions } from './conditions'
    
    export type CssObject = ${
      strict ? 'StyleObject<Conditions, PropTypes, true>' : 'StyleObject<Conditions, PropTypes>'
    } 

    export type ConditionalValue<T> = Conditional<Conditions, T>
    
    export type CssProperties = ${
      strict ? 'ConditionCssProperties<Conditions, PropTypes, true>' : 'ConditionCssProperties<Conditions, PropTypes>'
    }
    `,
  }
}
