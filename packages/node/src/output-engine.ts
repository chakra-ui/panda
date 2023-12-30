import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import type { Artifact, PandaHookable, Runtime } from '@pandacss/types'

interface OutputEngineOptions extends Generator {
  runtime: Runtime
  hooks: PandaHookable
}

export class OutputEngine {
  private paths: Generator['paths']
  private fs: Runtime['fs']
  private path: Runtime['path']

  constructor(options: OutputEngineOptions) {
    const {
      paths,
      runtime: { path, fs },
    } = options

    this.paths = paths
    this.fs = fs
    this.path = path
  }

  empty = () => {
    this.fs.rmDirSync(this.path.join(...this.paths.root))
  }

  write = (output: Artifact | undefined) => {
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
