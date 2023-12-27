import { usePandaContext } from '@/src/hooks/usePandaContext'
import { State } from '@/src/hooks/usePlayground'
import { PlaygroundConfig } from '@/src/lib/config/eval-config'
import { createProject } from '@pandacss/parser'
import { useMemo } from 'react'

export function usePanda(state: State, config: PlaygroundConfig | null) {
  const { code: source, css } = state

  const context = usePandaContext(config)

  const staticArtifacts = useMemo(() => {
    context.appendLayerParams()
    context.appendBaselineCss()

    const cssArtifacts = [
      { file: 'Tokens', code: context.stylesheet.getLayerCss('tokens') },
      { file: 'Reset', code: context.stylesheet.getLayerCss('reset') },
      { file: 'Global', code: context.stylesheet.getLayerCss('base') },
    ]

    return cssArtifacts
  }, [context])

  return useMemo(() => {
    const project = createProject({
      useInMemoryFileSystem: true,
      parserOptions: {
        join(...paths) {
          return paths.join('/')
        },
        ...context.parserOptions,
      },
      getFiles: () => ['code.tsx'],
      readFile: (file) => (file === 'code.tsx' ? source : ''),
      hooks: context.hooks,
    })

    const parserResult = project.parseSourceFile('code.tsx')
    context.appendParserCss(parserResult)
    const artifacts = context.getArtifacts() ?? []

    const allJsFiles = artifacts.flatMap((a) => a?.files.filter((f) => f.file.endsWith('.mjs')) ?? [])
    const previewJs = allJsFiles
      .map((f) => f.code?.replaceAll(/import .*/g, '').replaceAll(/export \* from '(.+?)';/g, ''))
      ?.join('\n')

    const cssArtifacts: CssFileArtifact[] = [
      { file: 'Utilities', code: context.stylesheet.getLayerCss('utilities') },
      { file: 'Recipes', code: context.stylesheet.getLayerCss('recipes') },
    ].concat(staticArtifacts)
    const previewCss = [css, ...cssArtifacts.map((a) => a.code ?? '')].join('\n')

    const panda = {
      previewCss,
      artifacts,
      previewJs,
      parserResult,
      cssArtifacts,
      context,
    }
    console.log(panda) // <-- useful for debugging purposes, don't remove
    return panda
  }, [source, css, context, staticArtifacts])
}

export type CssFileArtifact = {
  file: string
  code: string | undefined
  dir?: string[] | undefined
}

export type UsePanda = ReturnType<typeof usePanda>
