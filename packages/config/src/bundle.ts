import type { Config } from '@pandacss/types'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, normalize, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { RolldownOutput } from 'rolldown'
import { importMetaUrlPlugin } from './bundle-plugins'
import { PandaError } from './error'
import { readPandaVersion } from './version'

const nodeBuiltins = new Set([...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)])

export interface BundleConfigResult<T = Config> {
  config: T
  dependencies: string[]
}

/**
 * Bundle a config (or preset) module in memory with Rolldown and evaluate it via
 * a `data:` URL — no temp file is written. Mirrors the legacy in-memory loader
 * without re-adding `bundle-n-require`.
 */
export async function bundleConfig<T extends Config = Config>(
  filepath: string,
  cwd: string,
): Promise<BundleConfigResult<T>> {
  const { code, dependencies } = await bundleCode(filepath, cwd)
  const mod = await loadBundledModule(filepath, code)
  const hasDefaultExport = Object.prototype.hasOwnProperty.call(mod ?? {}, 'default')
  const exported = hasDefaultExport ? mod.default : mod
  const config = (hasDefaultExport && isPromiseLike(exported) ? await exported : exported) as T

  return { config, dependencies: [...dependencies] }
}

interface BundledCode {
  code: string
  dependencies: string[]
  stamp: string
}

const bundleCache = new Map<string, BundledCode>()
const pandaVersion = readPandaVersion()

async function bundleCode(filepath: string, cwd: string): Promise<BundledCode> {
  const key = `${pandaVersion}\0${cwd}\0${filepath}`
  const cacheFile = diskCacheFile(key, cwd)
  const cached = bundleCache.get(key) ?? readDiskCache(cacheFile)
  if (cached && cached.stamp === dependencyStamp(cached.dependencies, cwd)) {
    bundleCache.set(key, cached)
    return cached
  }

  const { rolldown } = await import('rolldown')

  const build = await rolldown({
    input: filepath,
    cwd,
    platform: 'node',
    external: (id) => nodeBuiltins.has(id),
    treeshake: false,
    plugins: [importMetaUrlPlugin()],
  })

  let chunks: Awaited<ReturnType<typeof build.generate>>
  try {
    chunks = await build.generate({ format: 'esm', exports: 'named', codeSplitting: false })
  } finally {
    await build.close?.()
  }

  const output = chunks.output.find((item) => item.type === 'chunk')
  if (!output || output.type !== 'chunk') {
    throw new PandaError('CONFIG_ERROR', '💥 Config bundle did not produce an executable module.')
  }

  const dependencies = collectDependencies(chunks.output, filepath, cwd)
  const stamp = dependencyStamp(dependencies, cwd)
  const bundled = { code: output.code, dependencies, stamp }
  if (dependencies.length > 0 && !stamp.includes('missing')) {
    bundleCache.set(key, bundled)
    await writeDiskCache(cacheFile, bundled)
  }
  return bundled
}

function diskCacheFile(key: string, cwd: string): string {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 16)
  return join(pandaCacheDir(cwd), 'bundles', `${hash}.json`)
}

function readDiskCache(file: string): BundledCode | undefined {
  try {
    const cached = JSON.parse(readFileSync(file, 'utf8')) as Partial<BundledCode>
    const valid =
      typeof cached.code === 'string' && Array.isArray(cached.dependencies) && typeof cached.stamp === 'string'
    return valid ? (cached as BundledCode) : undefined
  } catch {
    return undefined
  }
}

function writeDiskCache(file: string, bundled: BundledCode): Promise<void> {
  return mkdir(dirname(file), { recursive: true })
    .then(() => writeFile(file, JSON.stringify(bundled)))
    .catch(() => undefined)
}

function dependencyStamp(dependencies: string[], cwd: string): string {
  const base = canonical(cwd)
  return dependencies.map((dependency) => fileStamp(join(base, dependency))).join('|')
}

function fileStamp(path: string): string {
  try {
    const stat = statSync(path)
    return `${stat.mtimeMs}:${stat.size}`
  } catch {
    return 'missing'
  }
}

/** Evaluate bundled ESM by writing a temp file (preferred) or a `data:` URL fallback. */
async function loadBundledModule(filepath: string, code: string): Promise<Record<string, unknown>> {
  const target = tempTargetFor(filepath)

  let evalError: unknown

  if (target) {
    try {
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, code)
      try {
        return (await import(/* @vite-ignore */ pathToFileURL(target).href)) as Record<string, unknown>
      } finally {
        void unlink(target).catch(() => undefined)
      }
    } catch (error) {
      // Keep config evaluation errors: they name real paths, unlike the data: URL retry.
      if (!isUnresolvedTempModule(error, target)) evalError = error
    }
  }

  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`

  try {
    return (await import(/* @vite-ignore */ dataUrl)) as Record<string, unknown>
  } catch (error) {
    throw evalError ?? error
  }
}

function isUnresolvedTempModule(error: unknown, target: string): boolean {
  const message = error instanceof Error ? error.message : ''
  return message.includes('Cannot find module') && message.includes(basename(target))
}

function tempTargetFor(filepath: string): string | undefined {
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return join(pandaCacheDir(dirname(filepath)), `panda.config.bundled.${unique}.mjs`)
}

function pandaCacheDir(start: string): string {
  const nodeModules = nearestNodeModules(start)
  return nodeModules ? join(nodeModules, '.panda') : join(tmpdir(), 'panda-config')
}

function nearestNodeModules(start: string): string | undefined {
  let current = start
  while (true) {
    const candidate = join(current, 'node_modules')
    if (existsSync(candidate)) return candidate
    const parent = dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return value != null && typeof value === 'object' && typeof (value as { then?: unknown }).then === 'function'
}

type RolldownOutputItem = NonNullable<RolldownOutput['output']>[number]

function collectDependencies(output: RolldownOutputItem[], entry: string, cwd: string): string[] {
  const dependencies = new Set<string>()
  // Resolve through symlinks before diffing: Rolldown reports module ids by
  // realpath, so a symlinked `cwd` would otherwise yield the same file twice.
  const base = canonical(cwd)
  const add = (id: string) => dependencies.add(normalize(relative(base, canonical(id))))

  for (const item of output) {
    if (item.type !== 'chunk') continue
    Object.keys(item.modules ?? {}).forEach((id) => {
      if (isAbsolute(id)) add(id)
    })
  }

  if (isAbsolute(entry)) add(entry)
  return Array.from(dependencies)
}

function canonical(filepath: string): string {
  try {
    return realpathSync(filepath)
  } catch {
    return filepath
  }
}
