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
import { createGenerator } from '@pandacss/generator'
import type { LoadConfigResult } from '@pandacss/types'
import { type UserConfig } from '@pandacss/types'
import { createProject } from '../src'
import { getImportDeclarations } from '../src/import'

const staticFilePath = 'test.tsx'

const defaults = {
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
  },
  path: '',
} satisfies LoadConfigResult

function getProject(code: string, options?: <Conf extends UserConfig>(conf: Conf) => Conf) {
  const config = options ? options(defaults.config) : defaults.config
  const generator = createGenerator({ ...defaults, config })

  return createProject({
    useInMemoryFileSystem: true,
    getFiles: () => [staticFilePath],
    readFile: () => code,
    parserOptions: generator.parserOptions,
  })
}

export function getFixtureProject(code: string, options?: <Conf extends UserConfig>(conf: Conf) => Conf) {
  const config = options ? options(defaults.config) : defaults.config
  const generator = createGenerator({ ...defaults, config })

  const project = createProject({
    useInMemoryFileSystem: true,
    getFiles: () => [staticFilePath],
    readFile: () => code,
    parserOptions: generator.parserOptions,
  })

  return { parse: () => project.parseSourceFile(staticFilePath), generator }
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
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath)!
  return data.jsx
}

export function patternParser(code: string) {
  const project = getProject(code, (conf) => ({
    ...conf,
    patterns: {
      ...conf.patterns,
      stack: {
        properties: {
          align: { type: 'property', value: 'alignItems' },
          justify: { type: 'property', value: 'justifyContent' },
          direction: { type: 'property', value: 'flexDirection' },
          gap: { type: 'property', value: 'gap' },
        },
        transform(props) {
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
  }))
  const data = project.parseSourceFile(staticFilePath)!
  return data.pattern
}

export function jsxRecipeParser(code: string) {
  const project = getProject(code, (conf) => ({
    ...conf,
    theme: {
      ...conf.theme,
      recipes: {
        ...conf.theme?.recipes,
        button: {
          name: 'button',
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
  }))
  const data = project.parseSourceFile(staticFilePath)!
  return data.recipe
}
