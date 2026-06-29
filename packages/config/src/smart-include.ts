import type { UserConfig } from '@pandacss/types'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { PandaError } from './error'

export const SMART_INCLUDE_EXTENSIONS = ['js', 'mjs', 'cjs', 'jsx', 'ts', 'cts', 'mts', 'tsx', 'vue', 'svelte', 'astro']

const MANIFEST = 'panda.lib.json'
const PACKAGE_SPECIFIER = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i

export interface SmartIncludeResult {
  include: string[]
  excludes: string[]
  changed: boolean
}

export function resolveSmartInclude(include: string[], cwd: string, deps: Set<string>): SmartIncludeResult {
  const offenders: string[] = []
  const next: string[] = []
  const excludes: string[] = []
  let changed = false

  for (const entry of include) {
    if (!PACKAGE_SPECIFIER.test(entry)) {
      next.push(entry)
      continue
    }
    if (isLocalPath(entry, cwd)) {
      next.push(entry)
      continue
    }

    const packageDir = resolvePackageDir(entry, cwd)
    if (packageDir === undefined) {
      next.push(entry)
      continue
    }
    if (existsSync(join(packageDir, MANIFEST))) {
      offenders.push(entry)
      continue
    }

    deps.add(join(packageDir, 'package.json'))
    const base = globBase(packageDir, cwd)
    next.push(`${base}/**/*.{${SMART_INCLUDE_EXTENSIONS.join(',')}}`)
    excludes.push(`${base}/**/node_modules/**`)
    changed = true
  }

  if (offenders.length > 0) throw inIncludeError(offenders)
  return { include: changed ? next : include, excludes, changed }
}

export function expandSmartInclude(config: UserConfig, cwd: string, deps: Set<string>): UserConfig {
  if (!config.include || config.include.length === 0) return config

  const resolved = resolveSmartInclude(config.include, cwd, deps)
  if (!resolved.changed) return config

  return { ...config, include: resolved.include, exclude: mergeExcludes(config.exclude, resolved.excludes) }
}

export function mergeExcludes(existing: string[] | undefined, additions: string[]): string[] {
  return [...(existing ?? []), ...additions]
}

function isLocalPath(entry: string, cwd: string): boolean {
  return existsSync(isAbsolute(entry) ? entry : resolve(cwd, entry))
}

function resolvePackageDir(spec: string, cwd: string): string | undefined {
  const require = createRequire(resolve(cwd, 'noop.js'))

  const fromPackageJson = tryResolve(require, `${spec}/package.json`, cwd)
  if (fromPackageJson !== undefined) return dirname(fromPackageJson)

  const fromEntry = tryResolve(require, spec, cwd)
  return fromEntry === undefined ? undefined : nearestPackageDir(fromEntry)
}

function tryResolve(require: ReturnType<typeof createRequire>, request: string, cwd: string): string | undefined {
  try {
    return require.resolve(request, { paths: [cwd] })
  } catch {
    return undefined
  }
}

function nearestPackageDir(from: string): string | undefined {
  let dir = dirname(from)
  for (;;) {
    if (existsSync(join(dir, 'package.json'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

function globBase(packageDir: string, cwd: string): string {
  const rel = relative(cwd, packageDir)
  const base = rel !== '' && !rel.startsWith('..') ? rel : packageDir
  return toPosix(base)
}

function toPosix(path: string): string {
  return path.split(/[\\/]/).join('/')
}

function inIncludeError(specs: string[]): PandaError {
  const list = specs.map((spec) => JSON.stringify(spec)).join(', ')
  const plural = specs.length > 1
  return new PandaError(
    'CONFIG_ERROR',
    `💥 Design system${plural ? 's' : ''} in \`include\`: ${list}. ${plural ? 'They each ship' : 'It ships'} a ${MANIFEST}, so ${plural ? 'they belong' : 'it belongs'} in \`designSystem\`, not \`include\`. \`include\` is for files, not design systems.`,
  )
}
