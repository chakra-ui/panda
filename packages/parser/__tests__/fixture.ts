import { isCssProperty, allCssProperties } from '@pandacss/is-valid-prop'
import { utilities, conditions } from '@pandacss/fixture'
import { createProject } from '../src'
import { getImportDeclarations } from '../src/import'

const staticFilePath = 'test.tsx'
const properties = Array.from(
  new Set([
    'css',
    ...allCssProperties,
    ...Object.values(utilities).reduce((acc, prop) => {
      if (prop?.shorthand) {
        return acc.concat(prop.shorthand)
      }

      return acc
    }, [] as string[]),
    ...Object.keys(conditions),
  ]),
)

function getProject(code: string, options: { nodes?: any[] } = {}) {
  return createProject({
    useInMemoryFileSystem: true,
    getFiles: () => [staticFilePath],
    readFile: () => code,
    parserOptions: {
      importMap: {
        css: '.panda/css',
        recipe: '.panda/recipe',
        pattern: '.panda/pattern',
        jsx: '.panda/jsx',
      },
      jsx: {
        nodes: options.nodes ?? [],
        factory: 'panda',
        isStyleProp(prop) {
          return isCssProperty(prop) || prop === 'css'
        },
      },
    },
  })
}

export function importParser(code: string, option: { name: string; module: string }) {
  const project = getProject(code)
  const sourceFile = project.getSourceFile(staticFilePath)!
  const imports = getImportDeclarations(sourceFile, {
    match({ id, mod }) {
      return id === option.name && mod === option.module
    },
  })
  return imports.value
}

export function cssParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath, properties)!
  return {
    css: data.css,
  }
}

export function cvaParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath, properties)!
  return {
    cva: data.cva,
  }
}

export function styledParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath, properties)!
  return {
    cva: data.cva,
  }
}

export function recipeParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath, properties)!
  return data.recipe
}

export function jsxParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(staticFilePath, properties)!
  return data.jsx
}

export function jsxPatternParser(code: string) {
  const project = getProject(code, {
    nodes: [{ name: 'Stack', type: 'pattern', props: ['align', 'gap', 'direction'] }],
  })
  const data = project.parseSourceFile(staticFilePath, properties)!
  return data.jsx
}

export function jsxRecipeParser(code: string) {
  const project = getProject(code, {
    nodes: [{ name: 'Button', type: 'recipe', props: ['size', 'variant'] }],
  })
  const data = project.parseSourceFile(staticFilePath, properties)!
  return data.jsx
}
