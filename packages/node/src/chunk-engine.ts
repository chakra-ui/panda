import { mergeCss } from '@pandacss/core'
import type { Generator } from '@pandacss/generator'
import type { Artifact, PandaHookable } from '@pandacss/types'
import type { Runtime } from '@pandacss/types'

export const getChunkEngine = ({
  paths,
  config,
  runtime: { path, fs },
}: Generator & { runtime: Runtime; hooks: PandaHookable }): PandaChunksEngine => ({
  dir: path.join(...paths.chunk),
  readFile(file: string) {
    const fileName = path.join(...paths.chunk, this.format(file))
    return fs.existsSync(fileName) ? fs.readFileSync(fileName) : ''
  },
  getFiles() {
    const files = fs.existsSync(this.dir) ? fs.readDirSync(this.dir) : []
    return files.map((file) => fs.readFileSync(path.join(this.dir, file)))
  },
  format(file: string) {
    return path.relative(config.cwd, file).replaceAll(path.sep, '__').replace(path.extname(file), '.css')
  },
  getArtifact(file: string, css: string): Artifact {
    const fileName = this.format(file)
    const newCss = mergeCss(this.readFile(file), css)
    return {
      id: fileName,
      dir: paths.chunk,
      files: [{ file: fileName, code: newCss }],
    }
  },
  rm(file: string) {
    return fs.rmFileSync(path.join(...paths.chunk, this.format(file)))
  },
  empty() {
    return fs.rmDirSync(this.dir)
  },
  get glob() {
    return [`${this.dir}/**/*.css`]
  },
})

export interface PandaChunksEngine {
  dir: string
  readFile(file: string): string
  getFiles(): string[]
  format(file: string): string
  getArtifact(file: string, css: string): Artifact
  rm(file: string): void
  empty(): void
  glob: string[]
}
