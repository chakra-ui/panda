import { State } from '@/src/hooks/usePlayground'
import { getResolvedConfig } from '@/src/lib/resolve-config'
import * as pandaDefs from '@pandacss/dev'
import { Generator } from '@pandacss/generator'
import { createProject } from '@pandacss/parser'
import presetBase from '@pandacss/preset-base'
import presetTheme from '@pandacss/preset-panda'
import { Config, Preset, StaticCssOptions } from '@pandacss/types'
import { createHooks } from 'hookable'
import { merge } from 'merge-anything'
import { useEffect, useMemo, useRef, useState } from 'react'

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

const evalConfig = (config: string) => {
  const codeTrimmed = config
    .replaceAll(/export /g, '')
    .replaceAll(/import\s*{[^}]+}\s*from\s*['"][^'"]+['"];\n*/g, '')
    .trim()
    .replace(/;$/, '')

  try {
    return evalCode(`return (() => {${codeTrimmed}; return config})()`, pandaDefs)
  } catch (e) {
    return null
  }
}

const playgroundPreset: Preset = {
  theme: {
    recipes: {
      playgroundError: {
        className: 'playgroundError',
        base: {
          p: '2',
          color: 'red.400',
          display: 'flex',
          gap: '2',
          alignItems: 'center',
          background: { base: 'white', _dark: '#262626' },
          borderBottomWidth: '1px',
          borderBottomColor: { base: 'gray.100', _dark: '#262626' },
          textStyle: 'sm',

          '& > span': {
            borderRadius: 'full',
            display: 'flex',
            padding: '1',
            alignItems: 'center',
            background: {
              base: 'rgba(235, 94, 66, 0.2)',
              _dark: 'rgba(235, 94, 66, 0.1)',
            },
          },

          '& svg': {
            h: '16px',
            w: '16px',
          },
        },
        variants: {
          style: {
            empty: {},
          },
        },
      },
    },
  },
}

export function usePanda(state: State) {
  const { code: source, css, config } = state
  const [userConfig, setUserConfig] = useState<Config | null>(evalConfig(config))
  const previousContext = useRef<Generator | null>(null)

  useEffect(() => {
    const newUserConfig = evalConfig(config)
    if (newUserConfig) setUserConfig(newUserConfig)
  }, [config])

  const context = useMemo(() => {
    const { presets, ...restConfig } = userConfig ?? {}

    const config = getResolvedConfig({
      cwd: '',
      include: [],
      outdir: 'styled-system',
      preflight: true,
      optimize: true,
      presets: [presetBase, presetTheme, playgroundPreset, ...(presets ?? [])],
      ...restConfig,
      staticCss: merge(restConfig.staticCss, {
        recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'],
      }),

      jsxFramework: restConfig.jsxFramework ? 'react' : undefined,
    })

    try {
      // in event of error (invalid token format), use previous generator
      const context = new Generator({
        dependencies: [],
        serialized: '',
        deserialize: () => config!,
        path: '',
        hooks: createHooks(),
        config: config as any,
      })
      previousContext.current = context
      return context
    } catch {
      return previousContext.current!
    }
  }, [userConfig])

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
