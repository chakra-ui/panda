import { logger } from '@pandacss/logger'
import { PandaError } from '@pandacss/shared'
import type { Config } from '@pandacss/types'
import { isAbsolute, normalize, relative } from 'node:path'
import { builtinModules } from 'node:module'
import { rolldown } from 'rolldown'
import { findConfig } from './find-config'
import type { BundleConfigResult, ConfigFileOptions } from './types'

const nodeBuiltins = new Set([...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)])

export async function bundle<T extends Config = Config>(filepath: string, cwd: string) {
  const build = await rolldown({
    input: filepath,
    cwd,
    platform: 'node',
    external: (id) => nodeBuiltins.has(id),
    treeshake: false,
  })

  const chunks = await build.generate({
    format: 'esm',
    exports: 'named',
  })

  await build.close?.()

  const output = chunks.output.find((item) => item.type === 'chunk')
  if (!output || output.type !== 'chunk') {
    throw new PandaError('CONFIG_ERROR', `💥 Config bundle did not produce an executable module.`)
  }

  const dependencies = collectDependencies(chunks.output, filepath, cwd)
  const mod = await importBundledConfig(output.code)

  const config = (mod?.default ?? mod) as T

  return {
    config,
    dependencies,
  }
}

export async function bundleConfig(options: ConfigFileOptions): Promise<BundleConfigResult> {
  const { cwd, file } = options

  const filePath = findConfig({ cwd, file })

  logger.debug('config:path', filePath)

  const result = await bundle(filePath, cwd)

  if (typeof result.config !== 'object') {
    throw new PandaError('CONFIG_ERROR', `💥 Config must export or return an object.`)
  }

  result.config.outdir ??= 'styled-system'
  result.config.validation ??= 'warn'

  return {
    ...result,
    config: result.config,
    path: filePath,
  }
}

async function importBundledConfig(code: string) {
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  return import(/* @vite-ignore */ dataUrl)
}

function collectDependencies(
  output: Awaited<ReturnType<Awaited<ReturnType<typeof rolldown>>['generate']>>['output'],
  entry: string,
  cwd: string,
) {
  const dependencies = new Set<string>()
  const normalizeDependency = (id: string) => normalize(relative(cwd, id))

  for (const item of output) {
    if (item.type !== 'chunk') continue

    Object.keys(item.modules ?? {}).forEach((id) => {
      if (isAbsolute(id)) {
        dependencies.add(normalizeDependency(id))
      }
    })
  }

  dependencies.add(normalizeDependency(entry))
  return Array.from(dependencies)
}
