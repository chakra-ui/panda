import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import type { GeneratedArtifact, PandaHooks, Runtime } from '@pandacss/types'
import prettier from 'prettier'

interface OutputEngineOptions extends Generator {
  runtime: Runtime
  hooks: Partial<PandaHooks>
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

  rm = (absPath: string) => {
    this.fs.rmFileSync(absPath)
  }

  ensure = (file: string, cwd: string) => {
    const outPath = this.path.resolve(cwd, file)
    const dirname = this.path.dirname(outPath)
    this.fs.ensureDirSync(dirname)
    return outPath
  }

  write = async (output: GeneratedArtifact | undefined) => {
    if (!output?.content) return

    const absPath = this.path.join(...output.path)
    const dirname = this.path.dirname(absPath)
    this.fs.ensureDirSync(dirname)

    logger.debug('write:file', absPath)
    try {
      await this.fs.writeFile(absPath, await prettier.format(output.content, { filepath: absPath }))
    } catch (e) {
      // Prettier throws when the syntax is invalid
      logger.error('write:file:' + output.id, e)
    }
  }
}
