import type { Context } from './context'

export class PathEngine {
  constructor(private context: Pick<Context, 'config'>) {}

  private get cwd() {
    return this.context.config.cwd
  }

  private get emitPackage() {
    return this.context.config.emitPackage || false
  }

  private get outdir() {
    return this.context.config.outdir
  }

  getFilePath(file?: string) {
    return [this.cwd, this.emitPackage ? 'node_modules' : undefined, this.outdir, file].filter(Boolean) as string[]
  }

  get root() {
    return this.getFilePath()
  }

  get css() {
    return this.getFilePath('css')
  }

  get token() {
    return this.getFilePath('tokens')
  }

  get types() {
    return this.getFilePath('types')
  }

  get recipe() {
    return this.getFilePath('recipes')
  }

  get pattern() {
    return this.getFilePath('patterns')
  }

  get outCss() {
    return this.getFilePath('styles.css')
  }

  get jsx() {
    return this.getFilePath('jsx')
  }

  get themes() {
    return this.getFilePath('themes')
  }
}
