import type { ParserOptions } from '@pandacss/generator'
import type { ConfigTsOptions, PandaHookable, Runtime } from '@pandacss/types'
import {
  FileSystemRefreshResult,
  ScriptKind,
  SourceFile,
  Project as TsProject,
  type ProjectOptions as TsProjectOptions,
} from 'ts-morph'
import { createParser } from './parser'
import { ParserResult } from './parser-result'
import { svelteToTsx } from './svelte-to-tsx'
import { vueToTsx } from './vue-to-tsx'

const createTsProject = (options: Partial<TsProjectOptions>) =>
  new TsProject({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    ...options,
    compilerOptions: {
      allowJs: true,
      strictNullChecks: false,
      skipLibCheck: true,
      ...options.compilerOptions,
    },
  })

export interface ProjectOptions extends TsProjectOptions {
  readFile: Runtime['fs']['readFileSync']
  getFiles(): string[]
  hooks: PandaHookable
  parserOptions: ParserOptions
  tsOptions?: ConfigTsOptions
}

export class Project {
  project: TsProject
  parser: ReturnType<typeof createParser>

  constructor(private options: ProjectOptions) {
    const { parserOptions } = options

    this.project = createTsProject(options)
    this.parser = createParser(parserOptions)
    this.createSourceFiles()
  }

  get files() {
    return this.options.getFiles()
  }

  getSourceFile = (filePath: string): SourceFile | undefined => {
    return this.project.getSourceFile(filePath)
  }

  createSourceFile = (filePath: string): SourceFile => {
    const { readFile } = this.options
    return this.project.createSourceFile(filePath, readFile(filePath), {
      overwrite: true,
      scriptKind: ScriptKind.TSX,
    })
  }

  createSourceFiles = () => {
    const files = this.getFiles()
    for (const file of files) {
      this.createSourceFile(file)
    }
  }

  addSourceFile = (filePath: string, content: string): SourceFile => {
    return this.project.createSourceFile(filePath, content, {
      overwrite: true,
      scriptKind: ScriptKind.TSX,
    })
  }

  removeSourceFile = (filePath: string): boolean => {
    const sourceFile = this.project.getSourceFile(filePath)
    if (sourceFile) {
      return this.project.removeSourceFile(sourceFile)
    }
    return false
  }

  reloadSourceFile = (filePath: string): FileSystemRefreshResult | undefined => {
    return this.getSourceFile(filePath)?.refreshFromFileSystemSync()
  }

  reloadSourceFiles = () => {
    const files = this.getFiles()

    for (const file of files) {
      const source = this.getSourceFile(file)
      source?.refreshFromFileSystemSync() ?? this.project.addSourceFileAtPath(file)
    }
  }

  get readFile() {
    return this.options.readFile
  }

  get getFiles() {
    return this.options.getFiles
  }

  parseJson = (filePath: string) => {
    const { readFile, parserOptions } = this.options

    const content = readFile(filePath)
    parserOptions.encoder.fromJSON(content)

    const result = new ParserResult(parserOptions)
    return result.setFilePath(filePath)
  }

  parseSourceFile = (filePath: string, encoder?: ParserOptions['encoder']) => {
    const { hooks } = this.options

    if (filePath.endsWith('.json')) {
      return this.parseJson(filePath)
    }

    const sourceFile = this.project.getSourceFile(filePath)
    if (!sourceFile) return

    const content = sourceFile.getText()
    const transformed = this.transformFile(filePath, content)

    // update SourceFile AST if content is different (.vue, .svelte)
    if (content !== transformed) {
      sourceFile.replaceWithText(transformed)
    }

    hooks.callHook('parser:before', filePath, content)

    const result = this.parser(sourceFile, encoder)?.setFilePath(filePath)

    hooks.callHook('parser:after', filePath, result)

    return result
  }

  transformFile = (filePath: string, content: string): string => {
    if (filePath.endsWith('.vue')) {
      return vueToTsx(content)
    }

    if (filePath.endsWith('.svelte')) {
      return svelteToTsx(content)
    }

    return content
  }
}
