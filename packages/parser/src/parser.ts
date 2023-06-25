import { BoxNodeMap, extract, unbox, type BoxNode, type Unboxed, box } from '@pandacss/extractor'
import { logger } from '@pandacss/logger'
import { astish, memo } from '@pandacss/shared'
import type { SourceFile } from 'ts-morph'
import { Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { getImportDeclarations } from './import'
import { createParserResult } from './parser-result'
import type { RecipeConfig, ResultItem } from '@pandacss/types'

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
const isNodeRecipe = (node: ParserNodeOptions): node is ParserRecipeNode => node.type === 'recipe'

const cvaProps = ['compoundVariants', 'defaultVariants', 'variants', 'base']
const isCva = (map: BoxNodeMap['value']) => cvaProps.some((prop) => map.has(prop))

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
const fallback = (box: BoxNode) => ({
  value: undefined,
  getNode: () => box.getNode(),
  getStack: () => box.getStack(),
})

type GetEvaluateOptions = NonNullable<Parameters<typeof extract>['0']['getEvaluateOptions']>

type EvalOptions = ReturnType<GetEvaluateOptions>

const defaultEnv: EvalOptions['environment'] = { preset: 'NONE' }

export function createParser(options: ParserOptions) {
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

  return function parse(sourceFile: SourceFile | undefined) {
    if (!sourceFile) return

    const filePath = sourceFile.getFilePath()

    // Get all import declarations
    const imports = getImportDeclarations(sourceFile, {
      match(value) {
        return importRegex.some(({ regex, mod }) => regex.test(value.name) && value.mod.includes(mod))
      },
    })

    const collector = createParserResult()

    logger.debug(
      'ast:import',
      imports.value.length ? `Found import { ${imports} } in ${filePath}` : `No import found in ${filePath}`,
    )

    const [css] = importRegex
    const isValidPattern = imports.createMatch(importMap.pattern)
    const isValidRecipe = imports.createMatch(importMap.recipe)
    const isValidStyleFn = (name: string) => name === jsx?.factory
    const isFactory = (name: string) => jsx && name.startsWith(jsx.factory)

    const jsxFactoryAlias = jsx ? imports.getAlias(jsx.factory) : 'panda'
    const jsxPatternNodes = new RegExp(
      `^(${jsx?.nodes.map((node) => node.type === 'pattern' && node.name).join('|')})$`,
    )

    const recipes = new Set<string>()
    const patterns = new Set<string>()
    imports.value.forEach((importDeclaration) => {
      const { alias } = importDeclaration
      if (isValidRecipe(alias)) {
        recipes.add(alias)
      }

      if (isValidPattern(alias)) {
        patterns.add(alias)
      }
    })

    const functions = new Map<string, Map<string, boolean>>()
    const components = new Map<string, Map<string, boolean>>()

    const propertiesMap = new Map<string, boolean>()
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
        const alias = imports.getAlias(node.name)
        node.props?.forEach((prop) => propertiesMap.set(prop, true))

        functions.set(node.baseName, propertiesMap)
        functions.set(alias, propertiesMap)
        components.set(alias, propertiesMap)
      })
    }

    const getRecipeName = memo(options.getRecipeName)
    const isJsxTagRecipe = memo(
      (tagName: string) =>
        recipeJsxLists.string.has(tagName) || recipeJsxLists.regex.some((regex) => regex.test(tagName)),
    )

    const matchTag = memo((tagName: string) => {
      // ignore fragments
      if (!tagName) return false

      return (
        components.has(tagName) ||
        isUpperCase(tagName) ||
        tagName.startsWith(jsxFactoryAlias) ||
        isJsxTagRecipe(tagName)
      )
    })

    const matchTagProp = memo((tagName: string, propName: string) => {
      if (propertiesMap.size === 0) return true // = allow all

      if (
        Boolean(components.get(tagName)?.has(propName)) ||
        options.jsx?.isStyleProp(propName) ||
        propertiesMap.has(propName)
      )
        return true

      if (isJsxTagRecipe(tagName)) {
        const recipe = getRecipeByName(getRecipeName(tagName))
        return recipe != null && !!recipePropertiesByName.get(recipe.name)?.has(propName)
      }

      return false
    })

    const matchFn = memo((fnName: string) => {
      if (recipes.has(fnName) || patterns.has(fnName)) return true
      if (fnName === cvaAlias || fnName === cssAlias || fnName.startsWith(jsxFactoryAlias)) return true
      return functions.has(fnName)
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
        matchProp: () => true,
        matchArg: (prop) => {
          // skip resolving `badge` here: `panda("span", badge)`
          if (prop.fnName === jsxFactoryAlias && prop.index === 1 && Node.isIdentifier(prop.argNode)) return false
          return true
        },
      },
      taggedTemplates: {
        matchTaggedTemplate: (tag) => matchFn(tag.fnName),
      },
      getEvaluateOptions: (node) => ({ node: node as any, environment: defaultEnv }),
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
              if (query.kind === 'call-expression') {
                collector.set(name, {
                  name,
                  box: (query.box.value[0] as BoxNodeMap) ?? fallback(query.box),
                  data: combineResult(unbox(query.box.value[0])),
                })
              } else if (query.kind === 'tagged-template') {
                const obj = astish(query.box.value as string)
                collector.set(name, {
                  name,
                  box: query.box ?? fallback(query.box),
                  data: [obj],
                })
              }
            })
          })
          // stack({ ... })
          .when(isValidPattern, (name) => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression') {
                collector.setPattern(name, {
                  name,
                  box: (query.box.value[0] as BoxNodeMap) ?? fallback(query.box),
                  data: combineResult(unbox(query.box.value[0])),
                })
              }
            })
          })
          // button({ ... })
          .when(isValidRecipe, (name) => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression') {
                collector.setRecipe(name, {
                  name,
                  box: (query.box.value[0] as BoxNodeMap) ?? fallback(query.box),
                  data: combineResult(unbox(query.box.value[0])),
                })
              }
            })
          })
          // panda("span", { ... }) or panda("div", badge)
          // or panda("span", { color: "red.100", ... })
          // or panda('span')` color: red; `
          .when(isValidStyleFn, () => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression' && query.box.value[1]) {
                const map = query.box.value[1]
                const result: ResultItem = {
                  name,
                  box: (map as BoxNodeMap) ?? fallback(query.box),
                  data: combineResult(unbox(map)),
                }

                // CallExpression factory inline recipe
                // panda("span", { base: {}, variants: { ... } })
                if (box.isMap(map) && isCva(map.value)) {
                  collector.setCva(result)
                } else {
                  // CallExpression factory css
                  // panda("span", { color: "red.100", ... })
                  collector.set('css', result)
                }
              } else if (query.kind === 'tagged-template') {
                // TaggedTemplateExpression factory css
                // panda('span')` color: red; `
                const obj = astish(query.box.value as string)
                collector.set('css', {
                  name,
                  box: query.box ?? fallback(query.box),
                  data: [obj],
                })
              }
            })
          })
          // panda.span({ ... }) or panda.div` ...`
          .when(isFactory, (name) => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression') {
                const map = query.box.value[0]
                const result: ResultItem = {
                  name,
                  box: (map as BoxNodeMap) ?? fallback(query.box),
                  data: combineResult(unbox(map)),
                }

                // PropertyAccess factory inline recipe
                // panda.span({ base: {}, variants: { ... } })
                if (box.isMap(map) && isCva(map.value)) {
                  collector.setCva(result)
                } else {
                  // PropertyAccess factory css
                  // panda.span({ ... })
                  collector.set('css', result)
                }
              } else if (query.kind === 'tagged-template') {
                const obj = astish(query.box.value as string)
                collector.set('css', {
                  name,
                  box: query.box ?? fallback(query.box),
                  data: [obj],
                })
              }
            })
          })
          .otherwise(() => {
            //
          })
        //
      } else if (result.kind === 'component') {
        //
        result.queryList.forEach((query) => {
          //
          const data = combineResult(unbox(query.box))

          logger.debug(`ast:jsx:${name}`, { filePath, result: data })

          match(name)
            .when(
              (name) => jsx && name.startsWith(jsxFactoryAlias),
              (name) => {
                collector.setJsx({ name, box: query.box, type: 'jsx-factory', data })
              },
            )
            .when(
              (name) => jsxPatternNodes.test(name),
              (name) => {
                collector.setPattern(name, { type: 'jsx-pattern', name, box: query.box, data })
              },
            )
            .when(
              (name) => recipeJsxLists.string.has(name) || recipeJsxLists.regex.some((regex) => regex.test(name)),
              (name) => {
                collector.setRecipe(getRecipeName(name), { type: 'jsx-recipe', name, box: query.box, data })
              },
            )
            .otherwise(() => {
              collector.setJsx({ name, box: query.box, type: 'jsx', data })
            })
        })
      }
    })

    return collector
  }
}

const isUpperCase = (value: string) => value[0] === value[0]?.toUpperCase()
