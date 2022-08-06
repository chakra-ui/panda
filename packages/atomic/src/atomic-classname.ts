import { walkObject } from '@css-panda/walk-object'
import { Dict, GeneratorContext } from './types'

export function getAtomicClassName(props: Dict) {
  const { selectors = {}, '@media': mediaQueries = {}, ...styles } = props

  return (ctx: GeneratorContext) => {
    //
    const result = new Set<string>()

    function inner(props: Dict, scope?: string) {
      walkObject(props, (value, paths) => {
        let [prop, ...conditions] = paths

        conditions = conditions.filter((condition) => condition !== '_')
        const transformed = ctx.transform(prop, value)

        // get the base class name
        const baseArray = [...conditions, transformed.className]

        if (scope) {
          baseArray.unshift(`[${scope}]`)
        }

        result.add(baseArray.join(':'))
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
