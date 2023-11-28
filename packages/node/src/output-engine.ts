import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import type { Artifact, PandaHookable } from '@pandacss/types'
import type { Runtime } from '@pandacss/types'

export class PandaOutputEngine {
  private paths: Generator['paths']
  private fs: Runtime['fs']
  private path: Runtime['path']

  constructor({ paths, runtime: { path, fs } }: Generator & { runtime: Runtime; hooks: PandaHookable }) {
    this.paths = paths
    this.fs = fs
    this.path = path
  }

  empty(): void {
    this.fs.rmDirSync(this.path.join(...this.paths.root))
  }

  async write(output: Artifact | undefined): Promise<PromiseSettledResult<void>[] | undefined> {
    if (!output) return

    const { dir = this.paths.root, files } = output
    this.fs.ensureDirSync(this.path.join(...dir))

    return Promise.allSettled(
      files.map(async (artifact) => {
        if (!artifact?.code) return

        const { file, code } = artifact
        const absPath = this.path.join(...dir, file)

        logger.debug('write:file', dir.slice(-1).concat(file).join('/'))
        return this.fs.writeFile(absPath, code)
      }),
    )
  }
}
