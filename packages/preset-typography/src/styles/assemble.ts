import type { SystemStyleObject } from '@pandacss/types'
import type { ProseStyleParts } from './types'

function nestSelector(selector: string, notProseClass?: string): string {
  const parts = selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (!notProseClass) {
    return parts.map((part) => `& ${part}`).join(', ')
  }

  return parts
    .map((part) => `& :where(${part}):not(:where([class~="${notProseClass}"],[class~="${notProseClass}"] *))`)
    .join(', ')
}

/** Merge root props with nested element selectors into a recipe style object. */
export function assembleStyles(parts: ProseStyleParts, notProseClass?: string): SystemStyleObject {
  const nested: Record<string, SystemStyleObject> = {}

  for (const [selector, value] of Object.entries(parts.elements)) {
    nested[nestSelector(selector, notProseClass)] = value
  }

  return { ...parts.root, ...nested } as SystemStyleObject
}
