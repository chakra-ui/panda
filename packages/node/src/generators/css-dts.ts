import { readFileSync } from 'fs-extra'
import outdent from 'outdent'
import { getEntrypoint } from './get-entrypoint'

function getType(file: string) {
  const filepath = getEntrypoint('@css-panda/types', { dev: file })
  return readFileSync(filepath, 'utf8')
}

export function generateCssType() {
  return {
    cssType: getType('csstype.d.ts'),
    pandaCssType: getType('panda-csstype.d.ts'),
    publicType: outdent`
    import { PandaCssObject, PandaConditionalValue, ConditionCssProperties } from './panda-csstype'
    import { PropertyTypes } from './property-type'
    import { Conditions } from './conditions'
    
    export type CssObject = PandaCssObject<Conditions, PropertyTypes>

    export type ConditionalValue<V> = PandaConditionalValue<Conditions, V>
    
    export type CssProperties = ConditionCssProperties<Conditions, PropertyTypes>
    `,
  }
}
