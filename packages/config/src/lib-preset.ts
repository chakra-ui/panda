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

export async function compilePreset(configPath: string, cwd: string): Promise<CompilePresetResult> {
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
      return `import __panda_lib_config from ${JSON.stringify(configPath)}\nconst { ${fields}, ...preset } = __panda_lib_config\nexport default preset\n`
    },
  }
}
