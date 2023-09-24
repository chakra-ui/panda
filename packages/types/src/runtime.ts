interface Watcher {
  on(event: 'add' | 'addDir' | 'change', listener: (path: string) => void): this
  on(event: 'all', listener: (evt: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', path: string) => void): this
  close(): Promise<void>
}

interface InputOptions {
  include: string[]
  exclude?: string[]
  cwd?: string
}

interface FileSystem {
  readDirSync(dir: string): string[]
  existsSync(fileLike: string): boolean
  glob(opts: InputOptions): string[]
  readFileSync(filePath: string): string
  rmDirSync(dirPath: string): void
  writeFile(file: string, content: string): Promise<void>
  rmFileSync(file: string): void
  ensureDirSync(dirPath: string): void
  writeFileSync(filePath: string, content: string): void
  watch(options: InputOptions & { poll?: boolean }): Watcher
}

interface Path {
  join(...paths: string[]): string
  dirname(path: string): string
  extname(path: string): string
  relative(from: string, to: string): string
  isAbsolute(path: string): boolean
  sep: string
  abs(cwd: string, path: string): string
}

export interface Runtime {
  fs: FileSystem
  path: Path
  cwd(): string
  env(name: string): string | undefined
}
