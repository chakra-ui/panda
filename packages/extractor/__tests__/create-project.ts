import { Project, ts } from 'ts-morph'
import { extract } from '../src/extract'
import { type ExtractOptions } from '../src/types'

export const createProject = () => {
  return new Project({
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      jsxFactory: 'React.createElement',
      jsxFragmentFactory: 'React.Fragment',
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      noUnusedParameters: false,
      noEmit: true,
      useVirtualFileSystem: true,
      allowJs: true,
    },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
  })
}

export type TestExtractOptions = Omit<ExtractOptions, 'ast'> & { tagNameList?: string[]; functionNameList?: string[] }
export const getTestExtract = (
  project: Project,
  code: string,
  { tagNameList, functionNameList, ...options }: TestExtractOptions,
) => {
  const sourceFile = project.createSourceFile('file.tsx', code, { overwrite: true, scriptKind: ts.ScriptKind.TSX })
  return extract({
    ast: sourceFile,
    ...options,
    components: tagNameList
      ? {
          matchTag: ({ tagName }) => tagNameList.includes(tagName),
          matchProp: () => true,
        }
      : options.components,
    functions: functionNameList
      ? {
          matchFn: ({ fnName }) => functionNameList.includes(fnName),
          matchProp: () => true,
          matchArg: () => true,
        }
      : options.functions,
  })
}
