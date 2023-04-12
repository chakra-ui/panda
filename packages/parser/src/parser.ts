import { BoxNodeMap, extract, unbox, type Unboxed } from '@pandacss/extractor'
import { logger } from '@pandacss/logger'
import { memo } from '@pandacss/shared'
import type { SourceFile } from 'ts-morph'
import { Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { getImportDeclarations } from './import'
import { createParserResult } from './parser-result'
import type { RecipeConfig } from '@pandacss/types'

type ParserPatternNode = {
  name: string
  type: 'pattern'
  props?: string[]
  baseName: string
}
type ParserRecipeNode = {
  name: string
  type: 'recipe'
  props: string[]
  baseName: string
  jsx: RecipeConfig['jsx']
}

export type ParserNodeOptions = ParserPatternNode | ParserRecipeNode
export const isNodeRecipe = (node: ParserNodeOptions): node is ParserRecipeNode => node.type === 'recipe'

export type ParserOptions = {
  importMap: Record<'css' | 'recipe' | 'pattern' | 'jsx', string>
  jsx?: {
    factory: string
    nodes: ParserNodeOptions[]
    isStyleProp: (prop: string) => boolean
  }
  getRecipeName: (tagName: string) => string
  getRecipeByName: (name: string) => RecipeConfig | undefined
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

const combineResult = (unboxed: Unboxed) => {
  return [...unboxed.conditions, unboxed.raw, ...unboxed.spreadConditions]
}

export function createParser(options: ParserOptions) {
  return function parse(sourceFile: SourceFile | undefined, confProperties: string[]) {
    if (!sourceFile) return

    const filePath = sourceFile.getFilePath()
    const { jsx, importMap, getRecipeByName } = options

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

    const recipes = new Map<string, boolean>()
    imports.value.forEach((importDeclaration) => {
      const { name, alias } = importDeclaration
      const isRecipe = isValidRecipe(name)
      if (isRecipe) {
        recipes.set(alias, true)
      }
    })

    const functions = new Map<string, Map<string, boolean>>()
    const components = new Map<string, Map<string, boolean>>()

    const propertiesMap = new Map<string, boolean>(confProperties.map((prop) => [prop, true]))
    const recipePropertiesByName = new Map<string, Set<string>>()
    const recipeJsxLists = (jsx?.nodes ?? []).filter(isNodeRecipe).reduce(
      (acc, recipe) => {
        recipePropertiesByName.set(recipe.baseName, new Set(recipe.props ?? []))

        recipe.jsx?.forEach((jsx) => {
          if (typeof jsx === 'string') {
            acc.string.add(jsx)
          } else {
            acc.regex.push(jsx)
          }
        })

        return acc
      },
      { string: new Set<string>(), regex: [] as RegExp[] },
    )

    const cvaAlias = imports.getAlias('cva')
    const cssAlias = imports.getAlias('css')

    if (options.jsx) {
      options.jsx.nodes.forEach((node) => {
        const properties = node.props ? new Map(propertiesMap) : propertiesMap
        const alias = imports.getAlias(node.name)
        node.props?.forEach((prop) => properties.set(prop, true))

        functions.set(alias, properties)
        components.set(alias, properties)
      })
    }

    const getRecipeName = memo(options.getRecipeName)
    const isJsxTagRecipe = memo(
      (tagName: string) =>
        recipeJsxLists.string.has(tagName) || recipeJsxLists.regex.some((regex) => regex.test(tagName)),
    )

    const matchTag = memo((tagName: string) => {
      return (
        components.has(tagName) ||
        isUpperCase(tagName) ||
        tagName.startsWith(jsxFactoryAlias) ||
        isJsxTagRecipe(tagName)
      )
    })
    const matchTagProp = memo((tagName: string, propName: string) => {
      if (propertiesMap.size === 0) return true // = allow all

      if (Boolean(components.get(tagName)?.get(propName)) || propertiesMap.has(propName)) return true

      if (isJsxTagRecipe(tagName)) {
        const recipe = getRecipeByName(getRecipeName(tagName))
        if (recipe) {
          return recipePropertiesByName.get(recipe.name)?.has(propName) ?? false
        }
      }

      return false
    })

    const matchFn = memo((fnName: string) => {
      if (recipes.has(fnName)) return true
      if (fnName === cvaAlias || fnName === cssAlias || fnName.startsWith(jsxFactoryAlias)) return true
      return Boolean(functions.get(fnName))
    })
    const matchFnProp = memo((fnName: string, propName: string) => {
      if (propertiesMap.size === 0) return true // = allow all

      if (recipes.has(fnName)) return true
      if (fnName === cvaAlias) return true
      if (fnName.startsWith(jsxFactoryAlias)) return true
      if (fnName === cssAlias) return Boolean(propertiesMap.get(propName) || propName === 'selectors')
      return Boolean(functions.get(fnName)?.get(propName))
    })

    const measure = logger.time.debug(`Tokens extracted from ${filePath}`)
    const extractResultByName = extract({
      ast: sourceFile,
      components: {
        matchTag: (prop) => matchTag(prop.tagName),
        matchProp: (prop) => matchTagProp(prop.tagName, prop.propName),
      },
      functions: {
        matchFn: (prop) => matchFn(prop.fnName),
        matchProp: (prop) => matchFnProp(prop.fnName, prop.propName),
        matchArg: (prop) => {
          // skip resolving `badge` here: `panda("span", badge)`
          if (prop.fnName === jsxFactoryAlias && prop.index === 1 && Node.isIdentifier(prop.argNode)) return false
          return true
        },
      },
      flags: { skipTraverseFiles: true },
    })

    measure()

    extractResultByName.forEach((result, alias) => {
      const name = imports.getName(alias)
      logger.debug(`ast:${name}`, { filePath, result, alias })

      if (result.kind === 'function') {
        match(name)
          .when(css.match, (name: 'css' | 'cva') => {
            result.queryList.forEach((query) => {
              collector.set(name, {
                name,
                box: query.box.value[0] as BoxNodeMap,
                data: combineResult(unbox(query.box.value[0])),
              })
            })
          })
          // stack({ ... })
          .when(isValidPattern, (name) => {
            result.queryList.forEach((query) => {
              collector.setPattern(name, {
                name,
                box: query.box.value[0] as BoxNodeMap,
                data: combineResult(unbox(query.box.value[0])),
              })
            })
          })
          // button({ ... })
          .when(isValidRecipe, (name) => {
            result.queryList.forEach((query) => {
              collector.setRecipe(name, {
                name,
                box: query.box.value[0] as BoxNodeMap,
                data: combineResult(unbox(query.box.value[0])),
              })
            })
          })
          // panda("span", { ... }) or panda("div", badge)
          .when(isValidStyleFn, () => {
            result.queryList.forEach((query) => {
              collector.setCva({
                name,
                box: query.box.value[1] as BoxNodeMap,
                data: combineResult(unbox(query.box.value[1])),
              })
            })
          })
          .otherwise(() => {
            //
          })
      } else if (result.kind === 'component') {
        result.queryList.forEach((query) => {
          const data = combineResult(unbox(query.box))
          logger.debug(`ast:jsx:${name}`, { filePath, result: data })

          if (jsx && name.startsWith(jsxFactoryAlias)) {
            collector.jsx.add({ name, box: query.box, type: 'jsx-factory', data })
          } else if (jsxPatternNodes.test(name)) {
            collector.setPattern(name, { type: 'jsx-pattern', name, box: query.box, data })
          } else if (recipeJsxLists.string.has(name) || recipeJsxLists.regex.some((regex) => regex.test(name))) {
            collector.setRecipe(getRecipeName(name), { type: 'jsx-recipe', name, box: query.box, data })
          } else {
            collector.jsx.add({ name, box: query.box, type: 'jsx', data })
          }
        })
      }
    })

    return collector
  }
}

const isUpperCase = (value: string) => value[0] === value[0].toUpperCase()
