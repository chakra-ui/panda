import type { Config } from '@pandacss/types'
import { existsSync, realpathSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, normalize, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { rolldown } from 'rolldown'
import { importMetaUrlPlugin } from './bundle-plugins'
import { PandaError } from './error'

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
  const mod = await loadBundledModule(filepath, output.code)
  const hasDefaultExport = Object.prototype.hasOwnProperty.call(mod ?? {}, 'default')
  const exported = hasDefaultExport ? mod.default : mod
  const config = (hasDefaultExport && isPromiseLike(exported) ? await exported : exported) as T

  return { config, dependencies }
}

/** Evaluate bundled ESM by writing a temp file (preferred) or a `data:` URL fallback. */
async function loadBundledModule(filepath: string, code: string): Promise<Record<string, unknown>> {
  const target = tempTargetFor(filepath)

  if (target) {
    try {
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, code)
      try {
        return (await import(/* @vite-ignore */ pathToFileURL(target).href)) as Record<string, unknown>
      } finally {
        void unlink(target).catch(() => undefined)
      }
    } catch {
      // fall through to the data: URL loader
    }
  }

  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  return (await import(/* @vite-ignore */ dataUrl)) as Record<string, unknown>
}

function tempTargetFor(filepath: string): string | undefined {
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  const name = `panda.config.bundled.${unique}.mjs`
  const nodeModules = nearestNodeModules(dirname(filepath))
  const base = nodeModules ? join(nodeModules, '.panda') : join(tmpdir(), 'panda-config')
  return join(base, name)
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

function collectDependencies(
  output: Awaited<ReturnType<Awaited<ReturnType<typeof rolldown>>['generate']>>['output'],
  entry: string,
  cwd: string,
): string[] {
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
