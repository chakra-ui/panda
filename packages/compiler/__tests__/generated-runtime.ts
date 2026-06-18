import { posix } from 'node:path'
import { rolldown } from 'rolldown'
import type { Compiler } from '../src'

export interface LoadGeneratedModuleOptions {
  entry: string
}

export async function loadGeneratedModule<T>(compiler: Compiler, options: LoadGeneratedModuleOptions): Promise<T> {
  const modules = new Map<string, string>()
  for (const artifact of compiler.generateArtifacts()) {
    for (const file of artifact.files) {
      if (file.path.endsWith('.mjs')) {
        modules.set(posix.join('/styled-system', file.path), file.code)
      }
    }
  }

  const entry = normalizeEntry(options.entry)
  const build = await rolldown({
    input: entry,
    treeshake: false,
    plugins: [
      {
        name: 'panda-generated-artifacts',
        resolveId(source, importer) {
          if (!importer) return modules.has(source) ? source : null
          if (!source.startsWith('.')) return null

          const resolved = posix.normalize(posix.join(posix.dirname(importer), source))
          for (const candidate of [resolved, `${resolved}.mjs`]) {
            if (modules.has(candidate)) return candidate
          }

          return null
        },
        load(id) {
          return modules.get(id) ?? null
        },
      },
    ],
  })

  try {
    const { output } = await build.generate({ format: 'esm', exports: 'named', codeSplitting: false })
    const chunk = output.find((item) => item.type === 'chunk')
    if (!chunk || chunk.type !== 'chunk') throw new Error(`Failed to bundle generated module: ${options.entry}`)

    const dataUrl = `data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`
    return (await import(/* @vite-ignore */ dataUrl)) as T
  } finally {
    await build.close?.()
  }
}

function normalizeEntry(entry: string) {
  const normalized = posix.normalize(entry.startsWith('/') ? entry : posix.join('/styled-system', entry))
  return normalized.endsWith('.mjs') ? normalized : `${normalized}.mjs`
}
