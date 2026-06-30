import { builtinModules } from 'node:module'
import { rolldown } from 'rolldown'
import { importMetaUrlPlugin } from './bundle-plugins'
import { PandaError } from './error'

const APP_FIELDS = ['designSystem', 'include', 'exclude', 'outdir', 'cwd', 'watch', 'clean', 'gitignore', 'importMap']

const VIRTUAL_ENTRY = '\0panda-lib-preset-entry'
const nodeBuiltins = new Set([...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)])

export interface CompilePresetResult {
  code: string
  dependencies: string[]
}

export interface CompilePresetOptions {
  configPath: string
  cwd: string
}

export async function compilePreset(options: CompilePresetOptions): Promise<CompilePresetResult> {
  const { configPath, cwd } = options
  const build = await rolldown({
    input: VIRTUAL_ENTRY,
    cwd,
    platform: 'node',
    external: (id) => nodeBuiltins.has(id),
    treeshake: true,
    plugins: [importMetaUrlPlugin(), presetEntryPlugin(configPath)],
  })

  let chunks: Awaited<ReturnType<typeof build.generate>>
  try {
    chunks = await build.generate({ format: 'esm', exports: 'named', codeSplitting: false })
  } finally {
    await build.close?.()
  }

  const output = chunks.output.find((item) => item.type === 'chunk')
  if (!output || output.type !== 'chunk') {
    throw new PandaError('CONFIG_ERROR', '💥 Preset bundle did not produce an executable module.')
  }

  await validatePreset(output.code)

  const dependencies = Object.keys(output.modules ?? {}).filter((id) => id !== VIRTUAL_ENTRY)
  return { code: output.code, dependencies }
}

function presetEntryPlugin(configPath: string) {
  return {
    name: 'panda-lib-preset-entry',
    resolveId(id: string) {
      return id === VIRTUAL_ENTRY ? VIRTUAL_ENTRY : null
    },
    load(id: string) {
      if (id !== VIRTUAL_ENTRY) return null
      const fields = APP_FIELDS.join(', ')
      return `import __panda_lib_config from ${JSON.stringify(configPath)}
const __panda_lib_resolved = await __panda_lib_config
if (!${isPlainObjectSource()}(__panda_lib_resolved)) throw new Error('Config must export or return an object.')
const { ${fields}, ...preset } = __panda_lib_resolved
export default preset
`
    },
  }
}

function isPlainObjectSource(): string {
  return `((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
})`
}

async function validatePreset(code: string): Promise<void> {
  try {
    await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  } catch (error) {
    throw new PandaError('CONFIG_ERROR', `💥 Failed to compile design system preset: ${errorMessage(error)}`)
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
