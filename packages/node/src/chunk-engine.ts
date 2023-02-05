import { mergeCss } from '@pandacss/core'
import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import type { Artifact } from '@pandacss/types'
import type { Runtime } from '@pandacss/types/src/runtime'

export const getChunkEngine = ({ paths, config, runtime: { path, fs } }: Generator & { runtime: Runtime }) => ({
  dir: path.join(...paths.chunk),
  readFile(file: string) {
    const fileName = path.join(...paths.chunk, this.format(file))
    return fs.existsSync(fileName) ? fs.readFileSync(fileName) : ''
  },
  getFiles() {
    return fs.existsSync(this.dir) ? fs.readDirSync(this.dir) : []
  },
  format(file: string) {
    return path.relative(config.cwd, file).replaceAll(path.sep, '__').replace(path.extname(file), '.css')
  },
  getArtifact(file: string, css: string): Artifact {
    const fileName = this.format(file)
    const newCss = mergeCss(this.readFile(file), css)
    logger.debug('chunk:write', { file, path: fileName })
    return {
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
