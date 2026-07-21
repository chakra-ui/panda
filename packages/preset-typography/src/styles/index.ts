import type { SystemStyleObject } from '@pandacss/types'
import type { ProseSize } from '../types'
import { assembleStyles } from './assemble'
import { createBaseStyles } from './base'
import { createSizeStyles } from './sizes'

export function createProseBase(prefix: string, notProseClass?: string): SystemStyleObject {
  return assembleStyles(createBaseStyles(prefix), notProseClass)
}

export function createProseSize(size: ProseSize, notProseClass?: string): SystemStyleObject {
  return assembleStyles(createSizeStyles(size), notProseClass)
}

export { assembleStyles } from './assemble'
export { createBaseStyles } from './base'
export { createSizeStyles } from './sizes'
