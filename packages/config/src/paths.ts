import { isAbsolute, relative } from 'node:path'

export function toPosixPath(path: string): string {
  return path.includes('\\') ? path.split('\\').join('/') : path
}

export function toPosixRelative(from: string, to: string): string {
  const rel = toPosixPath(relative(from, to))
  return rel.startsWith('.') ? rel : `./${rel}`
}

export function toRelativeKey(key: string, cwd: string): string {
  return toPosixPath(isAbsolute(key) ? relative(cwd, key) : key)
}
