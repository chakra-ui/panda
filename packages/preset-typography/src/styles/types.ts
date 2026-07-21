import type { SystemStyleObject } from '@pandacss/types'

/** Root CSS props + nested element selectors (without `&` prefix). */
export type ProseStyleParts = {
  root: SystemStyleObject
  elements: Record<string, SystemStyleObject>
}
