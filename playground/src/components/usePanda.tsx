import { createGenerator } from '@pandacss/generator'
import { createProject } from '@pandacss/parser'
import presetBase from '@pandacss/preset-base'
import presetTheme from '@pandacss/preset-panda'
import { merge } from 'merge-anything'
import { createHooks } from 'hookable'
import { useMemo } from 'react'

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

export function usePanda(source: string, theme: string) {
  const userTheme = useMemo(() => {
    const codeTrimmed = theme
      .replaceAll(/export /g, '')
      .trim()
      .replace(/;$/, '')

    try {
      return evalCode(`return (() => {${codeTrimmed}; return theme})()`, {})
    } catch (e) {
      return null
    }
  }, [theme])

  const generator = useMemo(() => {
    const { extend, ...restTheme } = userTheme ?? {}
    const theme = Object.assign(merge({}, presetTheme.theme, extend) || {}, restTheme || {})

    return createGenerator({
      dependencies: [],
      path: '',
      hooks: createHooks(),
      config: {
        cwd: '',
        include: [],
        outdir: 'styled-system',
        ...presetBase,
        preflight: true,
        theme,
      },
    })
  }, [userTheme])

  return useMemo(() => {
    const project = createProject({
      useInMemoryFileSystem: true,
      parserOptions: generator.parserOptions,
      getFiles: () => ['code.tsx'],
      readFile: (file) => (file === 'code.tsx' ? source : ''),
      hooks: generator.hooks,
    })

    const parserResult = project.parseSourceFile('code.tsx')
    console.log(parserResult)
    const parsedCss = parserResult ? generator.getParserCss(parserResult) ?? '' : ''
    const artifacts = generator.getArtifacts() ?? []

    const cssFiles = artifacts.flatMap((a) => a?.files.filter((f) => f.file.endsWith('.css')) ?? [])

    const allJsFiles = artifacts.flatMap((a) => a?.files.filter((f) => f.file.endsWith('.mjs')) ?? [])
    const jsFiles = allJsFiles.filter((f) => f.file.endsWith('.mjs'))

    const previewJs = jsFiles
      .map((f) => f.code?.replaceAll(/import .*/g, '').replaceAll(/export \* .*/g, ''))
      .join('\n')

    const presetCss = cssFiles.map((f) => f.code).join('\n')
    const previewCss = ['@layer reset, base, tokens, recipes, utilities;', presetCss, parsedCss].join('\n')

    const cssArtifacts = artifacts.reduce(
      (acc, artifact) => {
        const artifactCss = (artifact?.files?.filter((art) => art.code && art.file.endsWith('.css')) ?? []).map(
          (file) => ({
            ...file,
            dir: artifact?.dir,
          }),
        )
        return acc.concat(artifactCss)
      },
      [{ code: previewCss, file: 'styles.css' }] as CssFileArtifact[],
    )

    const patternNames = Object.keys(generator.config.patterns ?? {})
    return {
      parserResult,
      parsedCss,
      previewCss,
      previewJs,
      patternNames,
      artifacts,
      cssArtifacts,
    }
  }, [source, generator])
}

export type CssFileArtifact = {
  file: string
  code: string | undefined
  dir: string[] | undefined
}
