import { createGenerator } from '@pandacss/generator'
import { createProject } from '@pandacss/parser'
import { merge } from 'merge-anything'
import { config } from '@pandacss/presets'
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
    const theme = Object.assign(merge({}, config.theme, extend) || {}, restTheme || {})

    return createGenerator({
      dependencies: [],
      path: '',
      //@ts-expect-error - fix types
      config: {
        ...config,
        preflight: true,
        theme,
        outdir: 'design-system',
      },
    })
  }, [userTheme])

  return useMemo(() => {
    const project = createProject({
      useInMemoryFileSystem: true,
      parserOptions: generator.parserOptions,
      getFiles: () => ['code.tsx'],
      readFile: (file) => (file === 'code.tsx' ? source : ''),
    })
    const result = project.parseSourceFile('code.tsx')
    const parsedCss = result ? generator.getParserCss(result) ?? '' : ''
    const artifacts = generator.getArtifacts() ?? []

    const cssFiles = artifacts.flatMap((a) => a?.files.filter((f) => f.file.endsWith('.css')) ?? [])
    const allJsFiles = artifacts.flatMap((a) => a?.files.filter((f) => f.file.endsWith('.mjs')) ?? [])
    const jsFiles = allJsFiles.filter((f) => f.file.endsWith('.mjs'))
    const previewJs = jsFiles
      .map((f) => f.code?.replaceAll(/import .*/g, '').replaceAll(/export \* .*/g, ''))
      .join('\n')
    const presetCss = cssFiles.map((f) => f.code).join('\n')
    const previewCss = ['@layer reset, base, tokens, recipes, utilities;', presetCss, parsedCss].join('\n')

    const patternNames = Object.keys(generator.config.patterns ?? {})
    return {
      parsedCss,
      previewCss,
      previewJs,
      patternNames,
      artifacts,
    }
  }, [source, generator])
}
