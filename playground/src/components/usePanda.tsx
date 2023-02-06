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
    const presetCss = cssFiles.map((f) => f.code).join('\n')
    // TODO add reset styles
    const previewCss = ['@layer reset, base, tokens, recipes, utilities;', parsedCss, presetCss].join('\n')
    return {
      previewCss,
      artifacts,
    }
  }, [source, generator])
}
