// NOTE: This file is used by the generators (in @css-panda/node). Do not rename or move it.

import { filterBaseConditions, toHash, walkObject, walkStyles } from '@css-panda/shared'
import type { Dict, GeneratorContext } from './types'

type Context = Pick<GeneratorContext, 'transform'> & {
  hash?: boolean
  conditions?: { shift: (paths: string[]) => string[] }
}

export function createCss(context: Context) {
  const { transform, hash, conditions: conds = { shift: (v) => v } } = context

  return (styleObject: Dict) => {
    const classNames = new Set<string>()

    walkStyles(styleObject, (props: Dict, scope?: string) => {
      walkObject(props, (value, paths) => {
        if (value == null) return

        const [prop, ...allConditions] = conds.shift(paths)

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
