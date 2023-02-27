import { extract, ExtractableMap, unbox } from '@box-extractor/core'
import { logger } from '@pandacss/logger'
import { memo } from '@pandacss/shared'
import type { ResultItem } from '@pandacss/types'
import type { SourceFile } from 'ts-morph'
import { match } from 'ts-pattern'
import { allCssProperties } from '../../is-valid-prop'
import { visitCallExpressions } from './call-expression'
import { getImportDeclarations } from './import'
import { visitJsxElement } from './jsx-element'
import { createParserResult } from './parser-result'

type ParserNodeOptions = {
  name: string
  type: 'pattern' | 'recipe'
  props?: string[]
  baseName: string
}

type ResultData = ResultItem['data']

export type ParserOptions = {
  importMap: Record<'css' | 'recipe' | 'pattern' | 'jsx', string>
  jsx?: {
    factory: string
    nodes: ParserNodeOptions[]
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

export type ParserMode = 'box-extractor' | 'internal'
export function createParser(options: ParserOptions) {
  return function parse(sourceFile: SourceFile | undefined, mode: ParserMode = 'internal') {
    if (!sourceFile) return

    const filePath = sourceFile.getFilePath()
    const { jsx, importMap } = options

    // Create regex for each import map
    const importRegex = [
      createImportMatcher(importMap.css, ['css', 'cva']),
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

    const collector = createParserResult()

    if (!imports.value.length) {
      logger.debug('ast:import', `No import found in ${filePath}`)
      return collector
    }

    logger.debug('ast:import', `Found import { ${imports} } in ${filePath}`)

    const [css] = importRegex
    const isValidPattern = imports.createMatch(importMap.pattern)
    const isValidRecipe = imports.createMatch(importMap.recipe)
    const isValidStyleFn = (name: string) => name === jsx?.factory

    const jsxFactoryAlias = jsx ? imports.getAlias(jsx.factory) : 'panda'
    const jsxPatternNodes = new RegExp(`(${jsx?.nodes.map((node) => node.type === 'pattern' && node.name).join('|')})$`)
    const jsxRecipeNodes = new RegExp(`(${jsx?.nodes.map((node) => node.type === 'recipe' && node.name).join('|')})$`)

    if (mode === 'box-extractor') {
      const functions = { css: { properties: allCssProperties }, cva: { properties: 'all' } } as ExtractableMap
      let components
      if (options.jsx) {
        functions[options.jsx.factory] = { properties: 'all' }

        components = {
          [`${options.jsx.factory}.*`]: { properties: allCssProperties },
          ...options.jsx.nodes.reduce((acc, node) => {
            const properties = (node.props || []).concat(allCssProperties)

            functions[node.name] = { properties }
            acc[imports.getAlias(node.name)] = { properties }

            return acc
          }, {}),
        }
      }

      const measure = logger.time.debug(`Tokens extracted from ${filePath}`)
      const extractResultByName = extract({ ast: sourceFile, components, functions })
      measure()

      extractResultByName.forEach((result, alias) => {
        const name = imports.getName(alias)
        logger.debug(`ast:${name}`, { filePath, result, alias })

        if (result.kind === 'function') {
          match(name)
            .when(css.match, (name: 'css' | 'cva') => {
              result.queryList.forEach((query) => {
                collector.set(name, { name, box: query.box, data: unbox(query.box) as ResultData })
              })
            })
            .when(isValidPattern, (name) => {
              result.queryList.forEach((query) => {
                collector.setPattern(name, { name, box: query.box, data: unbox(query.box) as ResultData })
              })
            })
            .when(isValidRecipe, (name) => {
              result.queryList.forEach((query) => {
                collector.setRecipe(name, { name, box: query.box, data: unbox(query.box) as ResultData })
              })
            })
            .when(isValidStyleFn, () => {
              result.queryList.forEach((query) => {
                collector.setCva({ name, box: query.box, data: unbox(query.box) as ResultData })
              })
            })
            .otherwise(() => {
              //
            })
        } else if (result.kind === 'component') {
          result.queryList.forEach((query) => {
            let type: string

            const data = unbox(query.box) as ResultData
            logger.debug(`ast:jsx:${name}`, { filePath, result: data })

            if (jsx && name.startsWith(jsxFactoryAlias)) {
              type = 'jsx-factory'
            } else if (jsxPatternNodes.test(name)) {
              type = 'pattern'
            } else if (jsxRecipeNodes.test(name)) {
              type = 'recipe'
            } else {
              type = 'jsx'
            }

            collector.jsx.add({ name, box: query.box, type, data })
          })
        }
      })

      return collector
    }

    const measure = logger.time.debug(`Tokens extracted & collected from ${filePath}`)
    // Get all call expressions (css, cssMap, etc)
    visitCallExpressions(sourceFile, {
      match: memo((name) => imports.match(name)),
      fn({ name: _name, data }) {
        const name = imports.getName(_name)

        const [css] = importRegex
        const result = { name, data }

        logger.debug(`ast:${name}`, { filePath, result })

        match(name)
          .when(css.match, (name: 'css' | 'cva') => {
            collector.set(name, result)
          })
          .when(isValidPattern, (name) => {
            collector.setPattern(name, result)
          })
          .when(isValidRecipe, (name) => {
            collector.setRecipe(name, result)
          })
          .when(isValidStyleFn, () => {
            collector.setCva(result)
          })
          .otherwise(() => {
            //
          })
      },
    })

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

        logger.debug(`ast:jsx:${name}`, { filePath, result: data })

        if (jsx && name.startsWith(jsxFactoryAlias)) {
          type = 'jsx-factory'
        } else if (jsxPatternNodes.test(name)) {
          type = 'pattern'
        } else if (jsxRecipeNodes.test(name)) {
          type = 'recipe'
        } else {
          type = 'jsx'
        }

        collector.jsx.add({ type, name, data })
      },
    })

    measure()

    return collector
  }
}

const isUpperCase = (value: string) => value[0] === value[0].toUpperCase()
