import { mergeConfigs } from '@pandacss/config'
import {
  breakpoints,
  conditions,
  keyframes,
  patterns,
  recipes,
  semanticTokens,
  tokens,
  utilities,
} from '@pandacss/fixture'
import { Generator } from '@pandacss/generator'
import { parseJson, stringifyJson } from '@pandacss/shared'
import type { Config, LoadConfigResult, PandaHooks, TSConfig } from '@pandacss/types'
import { createHooks } from 'hookable'
import { createProject } from '../src'
import { getImportDeclarations } from '../src/import'

const staticFilePath = 'app/src/test.tsx'

const defaults: Omit<LoadConfigResult, 'serialized' | 'deserialize'> = {
  dependencies: [],
  config: {
    cwd: '',
    include: [],
    utilities,
    patterns,
    optimize: true,
    theme: {
      tokens,
      semanticTokens,
      breakpoints,
      keyframes,
      recipes,
    },
    cssVarRoot: ':where(html)',
    conditions: {
      ...conditions,
      dark: '[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]',
      light: '[data-theme=light] &, .light &, &.light, &[data-theme=light]',
    },
    outdir: '.panda',
    jsxFactory: 'panda',
  },
  path: '',
}

function getProject(code: string, userConfig?: Config) {
  return getFixtureProject(code, userConfig).project
}

export function getFixtureProject(code: string, userConfig?: Config, tsconfig?: TSConfig) {
  const resolvedConfig = userConfig ? mergeConfigs([defaults.config, userConfig]) : defaults.config
  const config = {
    ...resolvedConfig,
    outdir: userConfig?.outdir ?? defaults.config.outdir,
    cwd: userConfig?.cwd ?? defaults.config.cwd,
  } as typeof resolvedConfig
  const hooks = createHooks<PandaHooks>()

  const serialized = stringifyJson(config)
  const deserialize = () => parseJson(serialized)

  const generator = new Generator({ ...defaults, config, hooks, tsconfig, serialized, deserialize })

  const project = createProject({
    ...tsconfig,
    useInMemoryFileSystem: true,
    getFiles: () => [staticFilePath],
    readFile: () => code,
    parserOptions: {
      join(...paths) {
        return paths.join('/')
      },
      ...generator.parserOptions,
    },
    hooks,
  })

  return { parse: (filePath = staticFilePath) => project.parseSourceFile(filePath), generator, project }
}

export function importParser(code: string, option: { name: string; module: string }) {
  const project = getProject(code)
  const sourceFile = project.getSourceFile(staticFilePath)!
  const imports = getImportDeclarations(sourceFile, {
    match({ name, mod }) {
      return name === option.name && mod === option.module
    },
  })
  return imports.value
}

export function cssParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath)!
  return {
    css: data.css,
  }
}

export function cvaParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath)!
  return {
    cva: data.cva,
  }
}

export function svaParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath)!
  return {
    sva: data.sva,
  }
}

export function styledParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath)!
  return {
    cva: data.cva,
  }
}

export function recipeParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath)!
  return data.recipe
}

export function jsxParser(code: string) {
  const project = getProject(code, { jsxFramework: 'react' })
  const data = project.parseSourceFile(staticFilePath)!
  return data.jsx
}

export function patternParser(code: string) {
  const project = getProject(code, {
    patterns: {
      extend: {
        stack: {
          properties: {
            align: { type: 'property', value: 'alignItems' },
            justify: { type: 'property', value: 'justifyContent' },
            direction: { type: 'property', value: 'flexDirection' },
            gap: { type: 'property', value: 'gap' },
          },
          transform(props: any) {
            const { align = 'flex-start', justify, direction = 'column', gap = '10px', ...rest } = props
            return {
              display: 'flex',
              flexDirection: direction,
              alignItems: align,
              justifyContent: justify,
              gap,
              ...rest,
            }
          },
        },
      },
    },
  })
  const data = project.parseSourceFile(staticFilePath)!
  return data.pattern
}

export function jsxRecipeParser(code: string) {
  const project = getProject(code, {
    theme: {
      extend: {
        recipes: {
          button: {
            className: 'button',
            jsx: ['Button', /WithRegex$/],
            description: 'A button styles',
            base: { fontSize: 'lg' },
            variants: {
              size: {
                sm: { padding: '2', borderRadius: 'sm' },
                md: { padding: '4', borderRadius: 'md' },
              },
              variant: {
                primary: { color: 'white', backgroundColor: 'blue.500' },
                danger: { color: 'white', backgroundColor: 'red.500' },
                secondary: { color: 'pink.300', backgroundColor: 'green.500' },
              },
            },
          },
        },
      },
    },
  })
  const data = project.parseSourceFile(staticFilePath)!
  return data.recipe
}

export const parseAndExtract = (code: string, userConfig?: Config, tsconfig?: TSConfig) => {
  const { parse, generator } = getFixtureProject(code, userConfig, tsconfig)

  const parserResult = parse()!
  generator.appendParserCss(parserResult)
  const parserCss = generator.stylesheet.toCss({ optimize: true })

  return {
    generator,
    json: parserResult?.toArray().flatMap(({ box, ...item }) => item),
    css: parserCss,
  }
}
