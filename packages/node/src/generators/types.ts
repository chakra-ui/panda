import { readFileSync } from 'fs-extra'
import outdent from 'outdent'
import type { PandaContext } from '../context'
import { getEntrypoint } from './get-entrypoint'

function getType(file: string) {
  const filepath = getEntrypoint('@css-panda/types', { dev: file })
  return readFileSync(filepath, 'utf8')
}

export function generateCssType(ctx: PandaContext) {
  const strict = ctx.types?.strictTokens
  return {
    cssType: getType('csstype.d.ts'),
    pandaCssType: getType('panda-csstype.d.ts'),
    publicType: outdent`
    import { PandaCssObject, PandaConditionalValue, ConditionCssProperties } from './panda-csstype'
    import { PropertyTypes } from './property-type'
    import { Conditions } from './conditions'
    
    export type CssObject = ${
      strict ? 'PandaCssObject<Conditions, PropertyTypes, true>' : 'PandaCssObject<Conditions, PropertyTypes>'
    } 

    export type ConditionalValue<Value> = PandaConditionalValue<Conditions, Value>
    
    export type CssProperties = ${
      strict
        ? 'ConditionCssProperties<Conditions, PropertyTypes, true>'
        : 'ConditionCssProperties<Conditions, PropertyTypes>'
    }
    `,
  }
}
