import fs from 'fs-extra'
import outdent from 'outdent'
import { extname } from 'path'
import { getEntrypoint } from './__utils'

async function getCssType(file: string) {
  const filepath = getEntrypoint('@css-panda/types', {
    dev: file,
    prod: file.replace(extname(file), '.d.ts'),
  })
  return fs.readFile(filepath, 'utf8')
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
