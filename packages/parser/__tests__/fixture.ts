import { createContext } from '@pandacss/fixture'
import type { Config, TSConfig } from '@pandacss/types'
import { getImportDeclarations } from '../src/import'

const filePath = 'app/src/test.tsx'

function getProject(code: string, userConfig?: Config) {
  return getFixtureProject(code, userConfig).project
}

function getFixtureProject(code: string, userConfig?: Config, tsconfig?: TSConfig) {
  const ctx = createContext(Object.assign({}, userConfig, { tsconfig }))
  ctx.project.addSourceFile(filePath, code)
  return ctx
}

export function importParser(code: string, option: { name: string; module: string }) {
  const project = getProject(code)
  const sourceFile = project.getSourceFile(filePath)!
  const imports = getImportDeclarations(sourceFile, {
    match({ name, mod }) {
      return name === option.name && mod === option.module
    },
  })
  return imports.value
}

export function cssParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(filePath)!
  return {
    css: data.css,
  }
}

export function cssTemplateLiteralParser(code: string) {
  const project = getProject(code, { syntax: 'template-literal' })
  const data = project.parseSourceFile(filePath)!
  return {
    css: data.css,
  }
}

export function cvaParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(filePath)!
  return {
    cva: data.cva,
  }
}

export function svaParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(filePath)!
  return {
    sva: data.sva,
  }
}

export function styledParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(filePath)!
  return {
    cva: data.cva,
  }
}

export function recipeParser(code: string) {
  const project = getProject(code)
  const data = project.parseSourceFile(filePath)!
  return data.recipe
}

export function jsxParser(code: string) {
  const project = getProject(code, { jsxFramework: 'react' })
  const data = project.parseSourceFile(filePath)!
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
  const data = project.parseSourceFile(filePath)!
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
  const data = project.parseSourceFile(filePath)!
  return data.recipe
}

export const parseAndExtract = (code: string, userConfig?: Config, tsconfig?: TSConfig) => {
  const ctx = getFixtureProject(code, userConfig, tsconfig)
  const encoder = ctx.encoder.clone()
  const result = ctx.project.parseSourceFile(filePath, encoder)!
  const styles = ctx.decoder.clone().collect(encoder)

  return {
    ctx,
    encoder,
    styles,
    json: result?.toArray().flatMap(({ box, ...item }) => item),
    css: ctx.getParserCss(styles),
  }
}
