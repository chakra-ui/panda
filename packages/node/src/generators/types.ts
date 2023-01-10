import { allCssProperties } from '@pandacss/is-valid-prop'
import { readFileSync } from 'fs-extra'
import outdent from 'outdent'
import type { PandaContext } from '../context'
import { getEntrypoint } from './get-entrypoint'

function getType(file: string) {
  const filepath = getEntrypoint('@pandacss/types', { dev: file })
  return readFileSync(filepath, 'utf8')
}

export function generateCssType(ctx: PandaContext) {
  const propList = new Set(allCssProperties.concat(ctx.utility.keys()))
  return {
    cssType: getType('csstype.d.ts'),
    pandaCssType: getType('system-types.d.ts'),
    selectorType: getType('selectors.d.ts'),
    publicType: outdent`
    export { ConditionalValue } from './conditions'
    export { GlobalStyleObject, JsxStyleProps, SystemStyleObject } from './system-types'
    
    export type Assign<Target, Override> = Omit<Target, keyof Override> & Override
    `,
    styleProps: outdent`
    import { PropertyValue } from './prop-type'
  
    export type SystemProperties = {
      ${Array.from(propList)
        .map((v) => `\t${v}?: PropertyValue<'${v}'>`)
        .join('\n')}
    }
    `,
  }
}
