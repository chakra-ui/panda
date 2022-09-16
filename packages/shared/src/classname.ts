import { filterBaseConditions } from './filter-condition'
import { toHash } from './hash'
import { walkObject } from './walk-object'
import { walkStyles } from './walk-styles'

type Context = {
  transform: (prop: string, value: any) => { className: string }
  hash?: boolean
  conditions?: { shift: (paths: string[]) => string[] }
}

export function createCss(context: Context) {
  const { transform, hash, conditions: conds = { shift: (v) => v } } = context

  return (styleObject: Record<string, any>) => {
    const classNames = new Set<string>()

    walkStyles(styleObject, (props: Record<string, any>, scope?: string) => {
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
