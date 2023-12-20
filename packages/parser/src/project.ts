import type { StyleCollectorType } from '@pandacss/types'
import type { ParserOptions } from '@pandacss/generator'
import { ScriptKind, SourceFile, Project as TsProject, type ProjectOptions as TsProjectOptions } from 'ts-morph'
import { createParser } from './parser'
import { ParserResult } from './parser-result'
import type { ProjectOptions } from './project-types'
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

export const createProject = ({
  getFiles,
  readFile,
  parserOptions,
  hooks,
  ...projectOptions
}: ProjectOptions): PandaProject => {
  const project = createTsProject(projectOptions)
  const parser = createParser(parserOptions)
  const fork = () => {
    const hash = parserOptions.hashFactory.fork()
    const styles = parserOptions.styleCollector.fork()

    return () => styles.collect(hash)
  }

  const getSourceFile = (filePath: string) => project.getSourceFile(filePath)

  const removeSourceFile = (filePath: string) => {
    const sourceFile = project.getSourceFile(filePath)
    if (sourceFile) project.removeSourceFile(sourceFile)
  }

  const createSourceFile = (filePath: string) =>
    project.createSourceFile(filePath, readFile(filePath), {
      overwrite: true,
      scriptKind: ScriptKind.TSX,
    })

  const addSourceFile = (filePath: string, content: string) =>
    project.createSourceFile(filePath, content, {
      overwrite: true,
      scriptKind: ScriptKind.TSX,
    })

  const parseSourceFile = (filePath: string, hashFactory?: ParserOptions['hashFactory']) => {
    if (filePath.endsWith('.json')) {
      const content = readFile(filePath)
      parserOptions.hashFactory.fromJSON(content)
      const result = new ParserResult(parserOptions).setFilePath(filePath)
      return result
    }

    const sourceFile = project.getSourceFile(filePath)
    if (!sourceFile) return

    const content = sourceFile.getText()
    const transformed = transformFile(filePath, content)

    // update SourceFile AST if content is different (.vue, .svelte)
    if (content !== transformed) {
      sourceFile.replaceWithText(transformed)
    }

    hooks.callHook('parser:before', filePath, content)
    const result = parser(sourceFile, hashFactory)?.setFilePath(filePath)
    hooks.callHook('parser:after', filePath, result)

    return result
  }

  const files = getFiles()
  for (const file of files) {
    createSourceFile(file)
  }

  const reloadSourceFile = (filePath: string) => getSourceFile(filePath)?.refreshFromFileSystemSync()
  const reloadSourceFiles = () => {
    const files = getFiles()
    for (const file of files) {
      const source = getSourceFile(file)
      source?.refreshFromFileSystemSync() ?? project.addSourceFileAtPath(file)
    }
  }

  return {
    fork,
    getSourceFile,
    removeSourceFile,
    createSourceFile,
    addSourceFile,
    parseSourceFile,
    reloadSourceFile,
    reloadSourceFiles,
    files,
    getFiles,
    readFile,
  }
}

export interface PandaProject {
  fork: () => () => StyleCollectorType
  getSourceFile: (filePath: string) => SourceFile | undefined
  removeSourceFile: (filePath: string) => void
  createSourceFile: (filePath: string) => SourceFile
  addSourceFile: (filePath: string, content: string) => SourceFile
  parseSourceFile: (filePath: string, hashFactory?: ParserOptions['hashFactory']) => ParserResult | undefined
  reloadSourceFile: (filePath: string) => void
  reloadSourceFiles: () => void
  files: string[]
  getFiles: () => string[]
  readFile: (filePath: string) => string
}

const transformFile = (filePath: string, content: string) => {
  if (filePath.endsWith('.vue')) {
    return vueToTsx(content)
  }

  if (filePath.endsWith('.svelte')) {
    return svelteToTsx(content)
  }

  return content
}
