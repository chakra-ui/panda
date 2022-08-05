import { loadConfig } from 'unconfig';

type ConfigType = Record<string, any>;

export class Config {
  constructor(root?: string) {
    this.root = root;
    this.config = undefined;
  }

  private root: string | undefined;
  private config: ConfigType | undefined;

  public load() {
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

  public readConfig() {
    return this.config;
  }

  public get(path: string) {
    if (!this.config) return undefined;
    const keys = path.split('.');
    const value = keys.reduce((acc, nxt) => acc?.[nxt], this.config);
    return value;
  }

  public set(path: string, value: any) {
    if (!this.config) return undefined;
    const keys = path.split('.');
    let obj = this.config;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const next = keys[i + 1];
      if (next === undefined) {
        obj[key] = value;
        break;
      }
      obj = obj[key];
    }

    this.config = obj;
    return obj;
  }
}
