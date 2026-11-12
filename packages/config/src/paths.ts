import { toPosixPath } from '@pandacss/compiler-shared'
import { isAbsolute, relative } from 'node:path'

export { toPosixPath }

export function toPosixRelative(from: string, to: string): string {
  const rel = toPosixPath(relative(from, to))
  return rel.startsWith('.') ? rel : `./${rel}`
}

export function toRelativeKey(key: string, cwd: string): string {
  return toPosixPath(isAbsolute(key) ? relative(cwd, key) : key)
}
