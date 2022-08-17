import { walkObject } from '@css-panda/walk-object'
import { toHash } from './hash'
import type { Dict, GeneratorContext } from './types'

export class AtomicClassNames {
  constructor(private context: Pick<GeneratorContext, 'transform'>) {}

  css = (styleObject: Dict, { hash: shouldHash }: { hash?: boolean } = {}) => {
    const { selectors = {}, '@media': mediaQueries = {}, ...styles } = styleObject
    //
    const result = new Set<string>()

    const inner = (props: Dict, scope?: string) => {
      walkObject(props, (value, paths) => {
        let [prop, ...conditions] = paths

        conditions = conditions.filter((condition) => condition !== '_')
        const transformed = this.context.transform(prop, value)

        // get the base class name
        const baseArray = [...conditions, transformed.className]

        if (scope) {
          baseArray.unshift(`[${scope}]`)
        }

        const className = shouldHash ? toHash(baseArray.join(':')) : baseArray.join(':')
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

export const css = (styleObject: Dict) => {
  //@ts-ignore - This is intentional. `context` will be auto-generated
  const generator = new AtomicClassNames(context)
  return Array.from(generator.css(styleObject)).join(' ')
}
