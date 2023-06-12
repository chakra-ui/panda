import { Obj, pipe, tap } from 'lil-fp'
import { Project as TsProject, type ProjectOptions as TsProjectOptions, ScriptKind } from 'ts-morph'
import { createParser, type ParserOptions } from './parser'
import { ParserResult, type ParserResultJson } from './parser-result'
import { toHash } from '@pandacss/shared'
import { logger } from '@pandacss/logger'
import type { Runtime } from '@pandacss/types'

export type ProjectOptions = Partial<TsProjectOptions> & {
  readFile: (filePath: string) => string
  exists: (filePath: string) => boolean
  getFiles: () => string[]
  path: Runtime['path']
  cwd: string
  parserOptions: ParserOptions
  incremental?: boolean | undefined
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

export const createProject = ({
  getFiles,
  readFile,
  exists,
  path,
  cwd,
  parserOptions,
  incremental,
  ...projectOptions
}: ProjectOptions) => {
  const buildInfoPath = path.join(...parserOptions.buildInfoPath)

  return pipe(
    {
      project: createTsProject(projectOptions),
      parser: createParser(parserOptions),
      buildInfoMap: new Map<string, { hash: string; result: ParserResult }>(),
    },

    Obj.assign(({ project, parser, buildInfoMap: resultMap }) => ({
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
        const content = readFile(filePath)
        const relativeFilePath = path.relative(cwd, filePath)

        const hash = toHash(content)
        const cached = resultMap.get(relativeFilePath)

        if (cached?.hash !== hash) {
          // generated from `panda ship`
          const result = relativeFilePath.endsWith('.json')
            ? ParserResult.fromJSON(content)
            : parser(project.getSourceFile(relativeFilePath))

          if (result) {
            resultMap.set(relativeFilePath, { hash, result })
          }
        } else {
          logger.debug('parser', `[cache hit] skipping ${relativeFilePath}`)
        }

        return resultMap.get(relativeFilePath)?.result
      },
      getBuildInfoMap: () => resultMap,
    })),

    tap(({ createSourceFile, buildInfoMap }) => {
      const files = getFiles()
      for (const file of files) {
        createSourceFile(file)
      }

      if (!incremental) return
      if (!exists(buildInfoPath)) return

      logger.info('parser', `found build info from ${buildInfoPath}`)
      const buildInfoContent = readFile(buildInfoPath)
      if (buildInfoContent) {
        const buildInfo = JSON.parse(buildInfoContent) as Record<string, { hash: string; result: ParserResultJson }>
        for (const [filePath, info] of Object.entries(buildInfo)) {
          buildInfoMap.set(filePath, { hash: info.hash, result: ParserResult.fromJSON(info.result) })
        }
      }
    }),

    Obj.assign(({ getSourceFile, project, buildInfoMap }) => ({
      reloadSourceFile: (filePath: string) => {
        buildInfoMap.delete(filePath)
        return getSourceFile(filePath)?.refreshFromFileSystemSync()
      },
      reloadSourceFiles: () => {
        const files = getFiles()
        for (const file of files) {
          const source = getSourceFile(file)

          buildInfoMap.delete(file)
          source?.refreshFromFileSystemSync() ?? project.addSourceFileAtPath(file)
        }
      },
    })),

    Obj.omit(['project', 'parser', 'buildInfoMap']),
  )
}

export type Project = ReturnType<typeof createProject>
