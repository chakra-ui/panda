import { createRequire } from 'node:module'
import { resolve } from 'node:path'

export function tryResolveFrom(request: string, fromDir: string): string | undefined {
  try {
    return createRequire(resolve(fromDir, 'noop.js')).resolve(request, { paths: [fromDir] })
  } catch (error) {
    if (isResolveMiss(error)) return undefined
    throw error
  }
}

export function isResolveMiss(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : undefined
  return code === 'MODULE_NOT_FOUND' || code === 'ERR_PACKAGE_PATH_NOT_EXPORTED'
}
