/**
 * Generate the playground's own styled-system via `@pandacss/compiler-wasm`
 * instead of the native `panda codegen` CLI.
 *
 * The CLI loads the config through `@pandacss/config`'s `bundle.ts`, which
 * evaluates the bundled config from a `data:` URL. Configs that import packages
 * relying on `createRequire(import.meta.url)` (e.g. `@ark-ui`) break there, since
 * `import.meta.url` is the `data:` URL. Loading the config with a plain dynamic
 * `import()` (real `import.meta.url`) and running the wasm engine avoids that and
 * keeps the playground on the same compiler it uses at runtime.
 */
import { createCompilerFromSnapshot } from '@pandacss/compiler-wasm'
import { mergeConfigs } from '@pandacss/config/merge'
import { createConfigSnapshot } from '@pandacss/config/serialize'
import type { Config, Preset } from '@pandacss/types'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const playgroundDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Resolve declared presets (string names from node_modules, or objects) to a
 *  flat, depth-first list — nested presets first, matching merge precedence. */
async function resolvePresets(presets: Config['presets'] = []): Promise<Preset[]> {
  const resolved = await Promise.all(
    presets.map(async (entry) => {
      const preset = (typeof entry === 'string' ? (await import(entry)).default : await entry) as Preset
      const nested = await resolvePresets(preset.presets)
      return [...nested, preset]
    }),
  )
  return resolved.flat()
}

async function main() {
  const { default: config } = (await import('../panda.config.ts')) as { default: Config }

  const presets = await resolvePresets(config.presets)
  const merged = mergeConfigs([...presets, config]) as Config
  // Keep the resolved presets (token-origin metadata); theme is already folded in.
  merged.presets = presets

  const snapshot = createConfigSnapshot({ ...merged, cwd: playgroundDir, outdir: merged.outdir ?? 'styled-system' })
  const compiler = await createCompilerFromSnapshot(snapshot)
  const artifacts = compiler.generateArtifacts()

  const outdir = join(playgroundDir, merged.outdir ?? 'styled-system')
  await rm(outdir, { recursive: true, force: true })

  let count = 0
  for (const artifact of artifacts) {
    for (const file of artifact.files) {
      const dest = join(outdir, file.path)
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, file.code)
      count++
    }
  }

  console.log(`codegen: wrote ${count} files to ${outdir}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
