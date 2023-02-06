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
          outdir: '.',
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
    if (!result) return ''
    return generator.getParserCss(result) ?? ''
  }, [source, generator])
}
