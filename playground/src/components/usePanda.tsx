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
    const jsFiles = allJsFiles.filter((f) =>
      // need to filter by file name, because "patterns" define all a "const config" which clashes. "
      ['helpers.mjs', 'cva.mjs', 'css.mjs', 'cx.mjs', 'conditions.mjs'].includes(f.file),
    )
    const previewJs = jsFiles.map((f) => f.code?.replaceAll(/import .*/g, '')).join('\n')
    const presetCss = cssFiles.map((f) => f.code).join('\n')
    const previewCss = ['@layer reset, base, tokens, recipes, utilities;', presetCss, parsedCss].join('\n')
    return {
      parsedCss,
      previewCss,
      previewJs,
      artifacts,
    }
  }, [source, generator])
}
