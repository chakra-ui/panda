import { isCssProperty, allCssProperties } from '@pandacss/is-valid-prop'
import { utilities, conditions } from '@pandacss/fixture'
import { createProject } from '../src'
import { getImportDeclarations } from '../src/import'
import { isNodeRecipe, type ParserNodeOptions } from '../src/parser'
import { uncapitalize } from '@pandacss/shared'

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

function getProject(code: string, options: { nodes?: ParserNodeOptions[] } = {}) {
  const nodes = options.nodes ?? []
  const recipeNodes = nodes.filter(isNodeRecipe)

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
        nodes,
        factory: 'panda',
        isStyleProp(prop) {
          return isCssProperty(prop) || prop === 'css'
        },
      },
      getRecipeByName: () => undefined,
      getRecipeName: (jsx: string) => {
        const recipe = recipeNodes.find((node) => {
          return node.jsx?.some((tag) => (typeof tag === 'string' ? tag === jsx : tag.test(jsx)))
        })

        return recipe?.baseName ?? uncapitalize(jsx)
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
    nodes: [{ name: 'Stack', type: 'pattern', props: ['align', 'gap', 'direction'], baseName: 'Stack' }],
  })
  const data = project.parseSourceFile(staticFilePath, properties)!
  return data.pattern
}

export function jsxRecipeParser(code: string) {
  const project = getProject(code, {
    nodes: [{ name: 'Button', type: 'recipe', props: ['size', 'variant'], baseName: 'Button', jsx: ['Button'] }],
  })
  const data = project.parseSourceFile(staticFilePath, properties)!
  return data.recipe
}
