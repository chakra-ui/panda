import type { CodegenArtifact } from '@pandacss/compiler-shared'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface WriteArtifactsOptions {
  /** Output directory (e.g. `styled-system`), relative to `cwd` when given. */
  outdir: string
  cwd?: string
}

/**
 * Write codegen artifacts to disk under `outdir`. The engine returns outdir-less
 * relative paths; this is the node-only sink that prefixes + writes them. CSS is
 * **not** written here — `Driver.css()` returns the string for the consumer to
 * route (file / postcss `root.append` / bundler virtual module).
 *
 * Returns the absolute paths written.
 */
export async function writeArtifacts(artifacts: CodegenArtifact[], options: WriteArtifactsOptions): Promise<string[]> {
  const base = options.cwd ? join(options.cwd, options.outdir) : options.outdir
  const written: string[] = []
  for (const artifact of artifacts) {
    for (const file of artifact.files) {
      const target = join(base, file.path)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, file.code, 'utf8')
      written.push(target)
    }
  }
  return written
}
