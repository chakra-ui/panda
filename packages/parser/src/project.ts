import { Obj, pipe, tap } from 'lil-fp'
import { Project as TsProject, type ProjectOptions as TsProjectOptions, ScriptKind } from 'ts-morph'
import { createParser } from './parser'
import { ParserResult, createParserResult } from './parser-result'
import { vueToTsx } from './vue-to-tsx'
import { svelteToTsx } from './svelte-to-tsx'
import type { ProjectOptions } from './project-types'
import type { ParserResultType } from '@pandacss/types'

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
      parserResults: new Map<string, ParserResult>(),
    },

    Obj.assign(({ project, parser, parserResults }) => ({
      getSourceFile: (filePath: string) => project.getSourceFile(filePath),
      removeSourceFile: (filePath: string) => {
        const sourceFile = project.getSourceFile(filePath)
        if (sourceFile) project.removeSourceFile(sourceFile)
        parserResults.delete(filePath)
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
          const result = createParserResult(parserOptions).setFilePath(filePath).fromJSON(content)
          parserResults.set(filePath, result)
          hooks.callHook('parser:after', filePath, result as any as ParserResultType)

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
        const result = parser(sourceFile)?.setFilePath(filePath)
        if (result) {
          // console.log({ parseSourceFile: filePath })
          parserResults.set(filePath, result)
        }

        hooks.callHook('parser:after', filePath, result as any as ParserResultType)

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

const transformFile = (filePath: string, content: string) => {
  if (filePath.endsWith('.vue')) {
    return vueToTsx(content)
  }

  if (filePath.endsWith('.svelte')) {
    return svelteToTsx(content)
  }

  return content
}
