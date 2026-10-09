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
  const code = errorCode(error)
  return code === 'MODULE_NOT_FOUND' || code === 'ERR_PACKAGE_PATH_NOT_EXPORTED'
}

export type ResolveOutcome = { kind: 'resolved'; path: string } | { kind: 'not-installed' } | { kind: 'not-exported' }

export function resolveFrom(request: string, fromDir: string): ResolveOutcome {
  try {
    return { kind: 'resolved', path: createRequire(resolve(fromDir, 'noop.js')).resolve(request, { paths: [fromDir] }) }
  } catch (error) {
    const code = errorCode(error)
    if (code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') return { kind: 'not-exported' }
    if (code === 'MODULE_NOT_FOUND') return { kind: 'not-installed' }
    throw error
  }
}

function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : undefined
}
