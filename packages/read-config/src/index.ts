import { loadConfig } from 'unconfig'
import { dset } from 'dset'
import delve from 'dlv'

type ConfigType = Record<string, any>

export class Config {
  constructor(root?: string) {
    this.root = root
    this.config = undefined
  }

  private root: string | undefined
  private config: ConfigType | undefined
  public source: string | undefined

  public async load() {
    const { config, sources } = await loadConfig({
      sources: [
        {
          files: 'panda.config',
          extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
        },
      ],
      merge: false,
      cwd: this.root,
    })
    const source = sources.length ? /[^/]*$/.exec(sources[0])?.[0] : undefined
    this.config = config as ConfigType
    this.source = source
    return { config, source }
  }

  public readConfig() {
    return this.config
  }

  public get(path: string) {
    if (!this.config) return undefined
    return delve(this.config, path)
  }

  public set(path: string, value: any) {
    if (!this.config) return undefined
    let obj = this.config
    dset(obj, path, value)
    return obj
  }
}
