import { isCssProperty } from '@pandacss/is-valid-prop'
import { createProject } from '../src'
import { getImportDeclarations } from '../src/import'

const staticFilePath = 'test.tsx'

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

export function jsxPatternParser(code: string) {
  const project = getProject(code, {
    nodes: [{ name: 'Stack', type: 'pattern', props: ['align', 'gap', 'direction'] }],
  })
  const data = project.parseSourceFile(staticFilePath)!
  return data.jsx
}

export function jsxRecipeParser(code: string) {
  const project = getProject(code, {
    nodes: [{ name: 'Button', type: 'recipe', props: ['size', 'variant'] }],
  })
  const data = project.parseSourceFile(staticFilePath)!
  return data.jsx
}
