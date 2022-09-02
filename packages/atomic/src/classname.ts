import { walkObject } from '@css-panda/walk-object'
import { filterDefaults } from './filter-defaults'
import { toHash } from './hash'
import type { Dict, GeneratorContext } from './types'

export class ClassNames {
  hash: boolean
  constructor(private context: Pick<GeneratorContext, 'transform'> & { hash?: boolean }) {
    this.hash = !!context.hash
  }

  css = (styleObject: Dict) => {
    const { selectors = {}, '@media': mediaQueries = {}, ...styles } = styleObject
    //
    const result = new Set<string>()

    const inner = (props: Dict, scope?: string) => {
      walkObject(props, (value, paths) => {
        const [prop, ..._conditions] = paths

        const conditions = filterDefaults(_conditions)
        const transformed = this.context.transform(prop, value)

        // get the base class name
        const baseArray = [...conditions, transformed.className]

        if (scope) {
          baseArray.unshift(`[${scope.replaceAll(' ', '_')}]`)
        }

        const className = this.hash ? toHash(baseArray.join(':')) : baseArray.join(':')
        result.add(className)
      })
    }

    inner(styles)

    for (const [key, values] of Object.entries(selectors)) {
      inner(values as any, key)
    }

    for (const [key, values] of Object.entries(mediaQueries)) {
      inner(values as any, key)
    }

    return result
  }
}

export const createCss = (context: any) => {
  return (styleObject: Dict) => {
    const generator = new ClassNames(context)
    return Array.from(generator.css(styleObject)).join(' ')
  }
}
