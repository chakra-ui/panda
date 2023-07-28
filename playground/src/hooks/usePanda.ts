import { createGenerator } from '@pandacss/generator'
import { createProject } from '@pandacss/parser'
import presetBase from '@pandacss/preset-base'
import presetTheme from '@pandacss/preset-panda'
import * as pandaDefs from '@pandacss/dev'
import { capitalize } from '@pandacss/shared'

import { createHooks } from 'hookable'
import { useMemo } from 'react'
import { getResolvedConfig } from '@/src/lib/resolve-config'
import { merge } from 'merge-anything'
import { Config, Preset } from '@pandacss/types'
import { RecipeRule } from '@pandacss/types/dist/static-css'

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
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

export function usePanda(source: string, config: string) {
  const userConfig = useMemo<Config>(() => {
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
  }, [config])

  const generator = useMemo(() => {
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
        recipes: { playgroundError: ['*' as RecipeRule] },
      }),
      jsxFramework: 'react',
      // jsxFramework: restConfig.jsxFramework ? 'react' : undefined,
    })

    return createGenerator({
      dependencies: [],
      path: '',
      hooks: createHooks(),
      config: config as any,
    })
  }, [userConfig])

  return useMemo(() => {
    const project = createProject({
      useInMemoryFileSystem: true,
      parserOptions: {
        join(...paths) {
          return paths.join('/')
        },
        ...generator.parserOptions,
      },
      getFiles: () => ['code.tsx'],
      readFile: (file) => (file === 'code.tsx' ? source : ''),
      hooks: generator.hooks,
    })

    const parserResult = project.parseSourceFile('code.tsx')
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
      [{ code: parsedCss, file: 'styles.css' }] as CssFileArtifact[],
    )

    const patternNames = Object.keys(generator.config.patterns ?? {})
    const patternJsxNames = Object.entries(generator.config.patterns ?? {}).map(
      ([key, value]) => value.jsxName ?? capitalize(key),
    )

    // const patternJsxNames = userConfig.jsxFramework
    //   ? Object.entries(generator.config.patterns ?? {}).map(([key, value]) => value.jsxName ?? capitalize(key))
    //   : []
    const recipeNames = Array.from(generator.recipes.rules.keys())

    const panda = {
      parserResult,
      parsedCss,
      previewCss,
      previewJs,
      patternNames,
      patternJsxNames,
      recipeNames,
      artifacts,
      cssArtifacts,
    }
    console.log(panda) // <-- useful for debugging purposes, don't remove
    return panda
  }, [source, generator, userConfig])
}

export type CssFileArtifact = {
  file: string
  code: string | undefined
  dir: string[] | undefined
}
