import fs from 'fs-extra'
import path from 'path'
import outdent from 'outdent'

async function getCssType(file: string) {
  const cssType = require.resolve('@css-panda/types')
  const cssPath = path.join(path.dirname(cssType), 'src', file)
  return fs.readFile(cssPath, 'utf8')
}

export async function generateCssType() {
  return {
    cssType: await getCssType('csstype.d.ts'),
    pandaCssType: await getCssType('panda-csstype.ts'),
    publicType: outdent`
    import { PandaCssObject, PandaConditionalValue } from './panda-csstype'
    import { PropertyTypes } from './property-type'
    import { Conditions } from './conditions'
    
    export type CssObject = PandaCssObject<Conditions, PropertyTypes>
    export type ConditionalValue<V> = PandaConditionalValue<Conditions, V>
    `,
  }
}
