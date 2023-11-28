import { useEffect, useMemo, useRef, useState } from 'react'

import { Generator } from '@pandacss/generator'
import { createProject } from '@pandacss/parser'
import presetBase from '@pandacss/preset-base'
import presetTheme from '@pandacss/preset-panda'
import * as pandaDefs from '@pandacss/dev'
import { Config, Preset } from '@pandacss/types'
import { StaticCssOptions } from '@pandacss/types'

import { merge } from 'merge-anything'
import { createHooks } from 'hookable'

import { getResolvedConfig } from '@/src/lib/resolve-config'

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

export function usePanda(source: string, config: string) {
  const [userConfig, setUserConfig] = useState<Config | null>(evalConfig(config))
  const prevGenerator = useRef<Generator | null>(null)

  useEffect(() => {
    const newUserConfig = evalConfig(config)
    if (newUserConfig) setUserConfig(newUserConfig)
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
        recipes: { playgroundError: ['*'] } as StaticCssOptions['recipes'],
      }),

      jsxFramework: restConfig.jsxFramework ? 'react' : undefined,
    })

    try {
      // in event of error (invalid token format), use previous generator
      const generator = new Generator({
        dependencies: [],
        serialized: '',
        deserialize: () => config!,
        path: '',
        hooks: createHooks(),
        config: config as any,
      })
      prevGenerator.current = generator
      return generator
    } catch {
      return prevGenerator.current!
    }
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

    const previewJs = allJsFiles
      .map((f) => f.code?.replaceAll(/import .*/g, '').replaceAll(/export \* from '(.+?)';/g, ''))
      ?.join('\n')

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

    const panda = {
      previewCss,
      artifacts,
      previewJs,
      parserResult,
      cssArtifacts,
      generator,
      parsedCss,
    }
    console.log(panda) // <-- useful for debugging purposes, don't remove
    return panda
  }, [source, generator])
}

export type CssFileArtifact = {
  file: string
  code: string | undefined
  dir: string[] | undefined
}

export type UsePanda = ReturnType<typeof usePanda>
