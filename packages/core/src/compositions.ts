import { flatten } from '@css-panda/shared'
import type { Dict, PropertyConfig } from '@css-panda/types'
import { SerializeContext, serializeStyle } from './serialize'

export function assignCompositions(ctx: SerializeContext, compositions: Dict) {
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
