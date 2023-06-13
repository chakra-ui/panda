import { flatten } from '@pandacss/shared'
import type { Dict, PropertyConfig } from '@pandacss/types'
import { type SerializeContext, serializeStyle } from './serialize'

export function assignCompositions(compositions: Dict, ctx: SerializeContext) {
  for (const [key, values] of Object.entries(compositions)) {
    const flatValues = flatten(values ?? {})

    const config: PropertyConfig = {
      layer: 'compositions',
      className: key,
      values: Object.keys(flatValues),
      transform: (value) => {
        return serializeStyle(flatValues[value], ctx)
      },
    }

    ctx.utility.register(key, config)
  }
}
