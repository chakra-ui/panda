import { normalize } from 'path'

/**
 * Strip query string from a module ID.
 * Vite appends `?v=hash`, `?t=timestamp`, `?inline`, `?url` etc.
 */
export function stripQuery(id: string): string {
  const idx = id.indexOf('?')
  return idx >= 0 ? id.slice(0, idx) : id
}

/**
 * Normalize a file path to use forward slashes.
 * On Windows, `path.normalize()` produces backslashes but Vite uses forward slashes internally.
 */
export function normalizePath(filePath: string): string {
  return normalize(filePath).replace(/\\/g, '/')
}
