import { isCssProperty } from '@pandacss/is-valid-prop'
import { ScriptKind } from 'ts-morph'
import { createParser, createProject } from '../src'
import { getImportDeclarations } from '../src/import'

const importMap = {
  css: '.panda/css',
  cva: '.panda/css',
  recipe: '.panda/recipe',
  pattern: '.panda/pattern',
  jsx: '.panda/jsx',
}

const project = createProject()
function toSourceFile(code: string) {
  return project.createSourceFile('test.tsx', code, { overwrite: true, scriptKind: ScriptKind.TSX })
}

export function importParser(code: string, option: { name: string; module: string }) {
  const sourceFile = toSourceFile(code)
  const imports = getImportDeclarations(sourceFile, {
    match({ id, mod }) {
      return id === option.name && mod === option.module
    },
  })
  return imports.value
}

export function cssParser(code: string) {
  const parser = createParser({ importMap })
  const data = parser(toSourceFile(code))!
  return {
    css: data.css,
  }
}

export function cvaParser(code: string) {
  const parser = createParser({ importMap })
  const data = parser(toSourceFile(code))!
  return {
    cva: data.cva,
  }
}

export function styledParser(code: string) {
  const parser = createParser({
    importMap,
    jsx: {
      nodes: [],
      factory: 'panda',
      isStyleProp(prop) {
        return isCssProperty(prop) || prop === 'css'
      },
    },
  })
  const data = parser(toSourceFile(code))!
  return {
    cva: data.cva,
  }
}

export function recipeParser(code: string) {
  const parser = createParser({ importMap })
  return parser(toSourceFile(code))?.recipe
}

export function jsxParser(code: string) {
  const parser = createParser({
    importMap,
    jsx: {
      nodes: [],
      factory: 'panda',
      isStyleProp(prop) {
        return isCssProperty(prop) || prop === 'css'
      },
    },
  })
  return parser(toSourceFile(code))?.jsx
}

export function jsxPatternParser(code: string) {
  const parser = createParser({
    importMap,
    jsx: {
      nodes: [{ name: 'Stack', type: 'pattern', props: ['align', 'gap', 'direction'] }],
      factory: 'panda',
      isStyleProp(prop) {
        return isCssProperty(prop) || prop === 'css'
      },
    },
  })
  return parser(toSourceFile(code))?.jsx
}

export function jsxRecipeParser(code: string) {
  const parser = createParser({
    importMap,
    jsx: {
      nodes: [{ name: 'Button', type: 'recipe', props: ['size', 'variant'] }],
      factory: 'panda',
      isStyleProp(prop) {
        return isCssProperty(prop) || prop === 'css'
      },
    },
  })
  return parser(toSourceFile(code))?.jsx
}
