import { filterBaseConditions, toHash, walkObject, walkStyles } from '@css-panda/shared'
import type { Dict, GeneratorContext } from './types'

type Context = Pick<GeneratorContext, 'transform'> & { hash?: boolean }

export function createCss(context: Context) {
  const { transform, hash } = context

  return (styleObject: Dict) => {
    const classNames = new Set<string>()

    walkStyles(styleObject, (props: Dict, scope?: string) => {
      walkObject(props, (value, paths) => {
        if (value == null) return

        const [prop, ...allConditions] = paths

        const conditions = filterBaseConditions(allConditions)
        const transformed = transform(prop, value)

        // get the base class name
        const baseArray = [...conditions, transformed.className]

        if (scope) {
          baseArray.unshift(`[${scope.replaceAll(' ', '_')}]`)
        }

        const className = hash ? toHash(baseArray.join(':')) : baseArray.join(':')
        classNames.add(className)
      })
    })

    return Array.from(classNames).join(' ')
  }
}
