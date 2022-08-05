import { loadConfig } from 'unconfig';

type ConfigType = any;

export class Config {
  constructor(root?: string) {
    this.root = root;
  }

  private root: string | undefined;
  private config: ConfigType;

  private resolveConfig() {
    return loadConfig({
      sources: [
        {
          files: 'panda.config',
          extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
        },
      ],
      merge: false,
      cwd: this.root,
    });
  }

  public load(callback: (config: ConfigType) => void) {
    Promise.resolve(this.resolveConfig()).then(({ config }) => {
      this.config = config;
      callback(config);
    });
  }

  public async loadSync() {
    const { config } = await this.resolveConfig();
    this.config = config;
    return config;
  }

  public readConfig() {
    return this.config;
  }
}
