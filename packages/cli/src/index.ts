import { PandaError } from '@pandacss/shared'
import type { Parts, SystemStyleObject } from '@pandacss/types'

export * from './define'

export function defineParts<T extends Parts>(parts: T) {
  return function (config: Partial<Record<keyof T, SystemStyleObject>>): Partial<Record<keyof T, SystemStyleObject>> {
    return Object.fromEntries(
      Object.entries(config).map(([key, value]) => {
        const part = parts[key]
        if (part == null) {
          throw new PandaError(
            'NOT_FOUND',
            `Part "${key}" does not exist in the anatomy. Available parts: ${Object.keys(parts).join(', ')}`,
          )
        }
        return [part.selector, value]
      }),
    ) as any
  }
}
