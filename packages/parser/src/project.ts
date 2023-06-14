import { Obj, pipe, tap } from 'lil-fp'
import { Project as TsProject, type ProjectOptions as TsProjectOptions, ScriptKind } from 'ts-morph'
import { createParser, type ParserOptions } from './parser'
import { ParserResult } from './parser-result'
import type { PandaHookable } from '@pandacss/types'

export type ProjectOptions = Partial<TsProjectOptions> & {
  readFile: (filePath: string) => string
  getFiles: () => string[]
  hooks: PandaHookable
  parserOptions: ParserOptions
}

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

export const createProject = ({ getFiles, readFile, parserOptions, hooks, ...projectOptions }: ProjectOptions) =>
  pipe(
    {
      project: createTsProject(projectOptions),
      parser: createParser(parserOptions),
    },

    Obj.assign(({ project, parser }) => ({
      getSourceFile: (filePath: string) => project.getSourceFile(filePath),
      removeSourceFile: (filePath: string) => {
        const sourceFile = project.getSourceFile(filePath)
        if (sourceFile) project.removeSourceFile(sourceFile)
      },
      createSourceFile: (filePath: string) =>
        project.createSourceFile(filePath, readFile(filePath), {
          overwrite: true,
          scriptKind: ScriptKind.TSX,
        }),
      addSourceFile: (filePath: string, content: string) =>
        project.createSourceFile(filePath, content, {
          overwrite: true,
          scriptKind: ScriptKind.TSX,
        }),
      parseSourceFile: (filePath: string) => {
        if (filePath.endsWith('.json')) {
          const content = readFile(filePath)

          hooks.callHook('parser:before', filePath, content)
          const result = ParserResult.fromJSON(content).setFilePath(filePath)
          hooks.callHook('parser:after', filePath, result)

          return result
        }

        const sourceFile = project.getSourceFile(filePath)
        if (!sourceFile) return

        const content = sourceFile.getText()

        hooks.callHook('parser:before', filePath, content)
        const result = parser(sourceFile)?.setFilePath(filePath)
        hooks.callHook('parser:after', filePath, result)

        return result
      },
    })),

    tap(({ createSourceFile }) => {
      const files = getFiles()
      for (const file of files) {
        createSourceFile(file)
      }
    }),

    Obj.assign(({ getSourceFile, project }) => ({
      reloadSourceFile: (filePath: string) => getSourceFile(filePath)?.refreshFromFileSystemSync(),
      reloadSourceFiles: () => {
        const files = getFiles()
        for (const file of files) {
          const source = getSourceFile(file)
          source?.refreshFromFileSystemSync() ?? project.addSourceFileAtPath(file)
        }
      },
    })),

    Obj.omit(['project', 'parser']),
  )

export type Project = ReturnType<typeof createProject>
