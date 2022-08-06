import { loadConfig } from 'unconfig'
import { dset } from 'dset'
import delve from 'dlv'

type ConfigType = ({ vscCssPath: string } & Record<string, any>) | undefined
type Source = string | undefined

type LoadReturn = {
  config: ConfigType
  source: Source
}

const DEFAULT_CONFIG = {
  vscCssPath: './.panda/design-tokens/index.css',
}

export class Config {
  constructor(root?: string) {
    this.root = root
    this.config = undefined
  }

  private root: string | undefined
  private config: ConfigType
  public source: Source

  public async load() {
    const { config: loadedConfig, sources } = await loadConfig({
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
    const config = { ...DEFAULT_CONFIG, ...(loadedConfig as ConfigType) }
    this.config = config as ConfigType
    this.source = source
    return { config, source } as LoadReturn
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
