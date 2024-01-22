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
    const { paths, runtime } = options

    this.paths = paths
    this.fs = runtime.fs
    this.path = runtime.path
  }

  empty = () => {
    this.fs.rmDirSync(this.path.join(...this.paths.root))
  }

  ensure = (file: string, cwd: string) => {
    const outPath = this.path.resolve(cwd, file)
    const dirname = this.path.dirname(outPath)
    this.fs.ensureDirSync(dirname)
    return outPath
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
