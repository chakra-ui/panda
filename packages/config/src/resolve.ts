import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

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

/** The `"type"` of the nearest `package.json` above `start`. */
export function nearestPackageType(start: string): string | undefined {
  let current = start
  while (true) {
    const candidate = join(current, 'package.json')
    if (existsSync(candidate)) return (JSON.parse(readFileSync(candidate, 'utf8')) as { type?: string }).type
    const parent = dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}
