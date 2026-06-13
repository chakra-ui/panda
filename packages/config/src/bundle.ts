import type { Config } from '@pandacss/types'
import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import MagicString from 'magic-string'
import { realpathSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { isAbsolute, normalize, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { rolldown } from 'rolldown'
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
  const mod = await importBundledConfig(output.code)
  const hasDefaultExport = Object.prototype.hasOwnProperty.call(mod ?? {}, 'default')
  const exported = hasDefaultExport ? mod.default : mod
  const config = (hasDefaultExport && isPromiseLike(exported) ? await exported : exported) as T

  return { config, dependencies }
}

async function importBundledConfig(code: string) {
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  return import(/* @vite-ignore */ dataUrl)
}

function importMetaUrlPlugin() {
  return {
    name: 'panda-import-meta-url',
    transform(code: string, id: string) {
      if (!isAbsolute(id) || !code.includes('import.meta.url')) return

      const replacement = JSON.stringify(pathToFileURL(id).href)
      const patched = replaceImportMetaUrl(code, replacement)
      if (patched === code) return

      return { code: patched, map: null }
    },
  }
}

function replaceImportMetaUrl(code: string, replacement: string): string {
  const ast = parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  })
  const output = new MagicString(code)
  let changed = false

  simple(ast, {
    MemberExpression(node) {
      if (!isImportMetaUrl(node)) return

      output.overwrite(node.start, node.end, replacement)
      changed = true
    },
  })

  return changed ? output.toString() : code
}

type MemberExpressionNode = {
  type: 'MemberExpression'
  object: unknown
  property: unknown
  computed: boolean
  start: number
  end: number
}

function isImportMetaUrl(node: MemberExpressionNode): boolean {
  if (node.computed || !isIdentifier(node.property, 'url')) return false

  const object = node.object
  return isNode(object, 'MetaProperty') && isIdentifier(object.meta, 'import') && isIdentifier(object.property, 'meta')
}

function isIdentifier(value: unknown, name: string): value is { type: 'Identifier'; name: string } {
  return isNode(value, 'Identifier') && value.name === name
}

function isNode<T extends string>(value: unknown, type: T): value is { type: T } & Record<string, any> {
  return !!value && typeof value === 'object' && (value as { type?: unknown }).type === type
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
