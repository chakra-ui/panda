import { createGenerator } from '@pandacss/generator'
import { createProject } from '@pandacss/parser'
import { config } from '@pandacss/presets'
import type { Config } from '@pandacss/types'
import { useMemo } from 'react'

export function usePanda(source: string, userConfig: Config) {
  const generator = useMemo(
    () =>
      createGenerator({
        dependencies: [],
        path: '',
        //@ts-expect-error - fix types
        config: {
          ...config,
          preflight: true,
          ...userConfig,
          outdir: 'design-system',
        },
      }),
    [userConfig],
  )

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
