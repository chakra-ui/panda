import { logger } from '@css-panda/logger'
import { memo } from '@css-panda/shared'
import { CompilerOptions, Project, SourceFile } from 'ts-morph'
import { match } from 'ts-pattern'
import { visitCallExpressions } from './call-expression'
import { Collector } from './collector'
import { getImportDeclarations } from './import'
import { visitJsxElement } from './jsx-element'

export function createProject(compilerOptions: Partial<CompilerOptions> = {}) {
  return new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    compilerOptions: {
      allowJs: true,
      strictNullChecks: false,
      skipLibCheck: true,
      ...compilerOptions,
    },
  })
}

type ParserOptions = {
  importMap: Record<'css' | 'recipe' | 'pattern' | 'jsx', string>
  jsx?: {
    factory: string
    nodes: Array<{
      name: string
      props?: string[]
    }>
    isStyleProp: (prop: string) => boolean
  }
}

// create strict regex from array of strings
function createImportMatcher(mod: string, values?: string[]) {
  const regex = values ? new RegExp(`^(${values.join('|')})$`) : /.*/
  return {
    mod,
    regex,
    match(value: string) {
      return regex.test(value)
    },
  }
}

export function createParser(options: ParserOptions) {
  return function parse(sourceFile: SourceFile | undefined) {
    if (!sourceFile) return

    const fileName = sourceFile.getFilePath()
    const collector = new Collector()

    const { jsx, importMap } = options

    // Create regex for each import map
    const importRegex = [
      createImportMatcher(importMap.css, ['css', 'cssMap', 'globalCss']),
      createImportMatcher(importMap.recipe),
      createImportMatcher(importMap.pattern),
    ]

    if (jsx) {
      importRegex.push(createImportMatcher(importMap.jsx, [jsx.factory, ...jsx.nodes.map((node) => node.name)]))
    }

    // Get all import declarations
    const imports = getImportDeclarations(sourceFile, {
      match(value) {
        return importRegex.some(({ regex, mod }) => regex.test(value.id) && value.mod.includes(mod))
      },
    })

    if (imports.value.length) {
      logger.debug({
        type: 'ast:import',
        msg: `Found import { ${imports} } in ${fileName}`,
      })
    }

    const isValidPattern = imports.createMatch(importMap.pattern)
    const isValidRecipe = imports.createMatch(importMap.recipe)

    // Get all call expressions (css, cssMap, globalCss, etc)
    visitCallExpressions(sourceFile, {
      match: memo((name) => imports.match(name)),
      fn({ name: _name, data }) {
        const name = imports.getName(_name)

        const [css] = importRegex
        const result = { name, data }

        logger.debug({ type: `ast:${name}`, fileName, result })

        match(name)
          .when(css.match, (name) => {
            collector.set(name, result)
          })
          .when(isValidPattern, (name) => {
            collector.setPattern(name, result)
          })
          .when(isValidRecipe, (name) => {
            collector.setRecipe(name, result)
          })
          .otherwise(() => {
            //
          })
      },
    })

    const jsxFactoryAlias = jsx ? imports.getAlias(jsx.factory) : 'panda'
    const jsxPatternNodes = new RegExp(`(${jsx?.nodes.map((node) => node.name).join('|')})$`)

    visitJsxElement(sourceFile, {
      match: {
        tag: memo((name) => {
          return name.startsWith(jsxFactoryAlias) || isUpperCase(name)
        }),
        prop: ({ tag, name }) => {
          const node = jsx?.nodes.find((n) => n.name === tag)
          return !!jsx?.isStyleProp(name) || !!node?.props?.includes(name)
        },
      },
      fn({ name, data }) {
        let type: string
        if (jsx && name.startsWith(jsxFactoryAlias)) {
          type = 'jsx-factory'
        } else if (jsxPatternNodes.test(name)) {
          type = 'pattern'
        } else {
          type = 'jsx'
        }
        collector.jsx.add({ type, name, data })
      },
    })

    return collector
  }
}

const isUpperCase = (value: string) => value[0] === value[0].toUpperCase()
