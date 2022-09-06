import { TokenError } from '@css-panda/error'
import { walkObject } from '@css-panda/shared'
import type { Dict } from '@css-panda/types'

export function getTokenMap(values: Record<string, any>, options: { maxDepth?: number } = {}) {
  const { maxDepth = 1 } = options

  const map = new Map<string, string>()

  walkObject(
    values,
    (value, path) => {
      map.set(path.join('.'), value)
    },
    { maxDepth },
  )

  return map
}

export function getSemanticTokenMap(values: Dict) {
  const map = new Map<string, Map<string, string>>()

  walkObject(values, (value, path) => {
    if (path.length > 2) {
      throw new TokenError('[semantic-token] Expect token to be 2-levels deep')
    }

    const [key, condition] = path
    const isDefault = condition === '_' || condition === 'base'

    const prop = isDefault ? 'base' : condition

    if (!map.has(prop)) {
      map.set(prop, new Map())
    }

    map.get(prop)?.set(key, value)
  })

  return map
}
