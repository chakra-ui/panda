import { resolveTsPathPattern } from '@pandacss/config/ts-path'
import { BoxNodeMap, box, extract, unbox, type BoxNode, type Unboxed } from '@pandacss/extractor'
import type { Generator, ParserOptions } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { astish, memo } from '@pandacss/shared'
import type { ResultItem } from '@pandacss/types'
import type { SourceFile } from 'ts-morph'
import { Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { getImportDeclarations } from './import'
import { ParserResult } from './parser-result'

type ParserPatternNode = Generator['patterns']['details'][number]
type ParserRecipeNode = Generator['recipes']['details'][number]

export type ParserNodeOptions = ParserPatternNode | ParserRecipeNode
const isNodeRecipe = (node: ParserNodeOptions): node is ParserRecipeNode => node.type === 'recipe'
const isNodePattern = (node: ParserNodeOptions): node is ParserPatternNode => node.type === 'pattern'

const cvaProps = ['compoundVariants', 'defaultVariants', 'variants', 'base']
const isCva = (map: BoxNodeMap['value']) => cvaProps.some((prop) => map.has(prop))
const noop = (..._args: any[]) => void 0 as any

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
const fallback = (box: BoxNode) =>
  ({
    value: undefined,
    getNode: () => box.getNode(),
    getStack: () => box.getStack(),
  } as BoxNode)

type GetEvaluateOptions = NonNullable<Parameters<typeof extract>['0']['getEvaluateOptions']>

type EvalOptions = Exclude<ReturnType<GetEvaluateOptions>, void>

const defaultEnv: EvalOptions['environment'] = { preset: 'ECMA' }
const identityFn = (styles: any) => styles
const evaluateOptions: EvalOptions = { environment: defaultEnv }

export function createParser(context: ParserOptions) {
  const { jsx, isValidProperty, tsOptions, join, syntax } = context
  const getRecipesByJsxName = context.recipes.filter
  const getPatternsByJsxName = context.patterns.filter
  const [recipeKeys, patternKeys] = [context.recipes.keys, context.patterns.keys]

  const importMap = Object.fromEntries(Object.entries(context.importMap).map(([key, value]) => [key, join(...value)]))

  const isJsxEnabled = jsx.framework

  // Create regex for each import map
  const importRegex = [
    createImportMatcher(importMap.css, ['css', 'cva', 'sva']),
    createImportMatcher(importMap.recipe),
    createImportMatcher(importMap.pattern),
  ]

  if (isJsxEnabled) {
    importRegex.push(createImportMatcher(importMap.jsx, [jsx.factory, ...jsx.nodes.map((node) => node.jsxName)]))
  }

  return function parse(sourceFile: SourceFile | undefined, encoder?: Generator['encoder']) {
    if (!sourceFile) return

    const filePath = sourceFile.getFilePath()

    // Get all import declarations
    const imports = getImportDeclarations(sourceFile, {
      match(value) {
        let found: string | boolean = false

        for (const { regex, mod } of importRegex) {
          // if none of the imported values match the regex, skip
          if (!regex.test(value.name)) continue

          // this checks that `yyy` contains {outdir}/{folder} in `import xxx from yyy`
          if (value.mod.includes(mod)) {
            found = true
            break
          }

          // that might be a TS path mapping, it could be completely different from the actual path
          if (tsOptions?.pathMappings) {
            const filename = resolveTsPathPattern(tsOptions.pathMappings, value.mod)

            if (filename?.includes(mod)) {
              found = mod
              break
            }
          }
        }

        return found
      },
    })

    const parserResult = new ParserResult(context, encoder)

    logger.debug(
      'ast:import',
      imports.value.length ? `Found import { ${imports} } in ${filePath}` : `No import found in ${filePath}`,
    )

    if (!imports.value.length && !isJsxEnabled) {
      return parserResult
    }

    const [css] = importRegex
    const jsxFactoryAlias = isJsxEnabled ? imports.getAlias(jsx.factory) : 'styled'

    const isValidPattern = imports.createMatch(importMap.pattern, patternKeys)
    const isValidRecipe = imports.createMatch(importMap.recipe, recipeKeys)
    const isValidStyleFn = (name: string) => name === jsx.factory
    const isFactory = (name: string) => Boolean(isJsxEnabled && name.startsWith(jsxFactoryAlias))
    const isRawFn = (fullName: string) => {
      const name = fullName.split('.raw')[0] ?? ''
      return name === 'css' || isValidPattern(name) || isValidRecipe(name)
    }

    const patternPropertiesByJsxName = new Map<string, Set<string>>()
    const initialPatterns = { string: new Set<string>(), regex: [] as RegExp[] }
    const patternJsxLists = isJsxEnabled
      ? (jsx.nodes ?? []).filter(isNodePattern).reduce((acc, pattern) => {
          patternPropertiesByJsxName.set(pattern.jsxName, new Set(pattern.props ?? []))

          pattern.jsx.forEach((jsx) => {
            if (typeof jsx === 'string') {
              acc.string.add(jsx)
            } else if (jsx) {
              acc.regex.push(jsx)
            }
          })

          return acc
        }, initialPatterns)
      : initialPatterns

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
    const recipePropertiesByJsxName = new Map<string, Set<string>>()

    const initialRecipes = { string: new Set<string>(), regex: [] as RegExp[] }
    const recipeJsxLists = isJsxEnabled
      ? (jsx.nodes ?? []).filter(isNodeRecipe).reduce((acc, recipe) => {
          recipePropertiesByJsxName.set(recipe.jsxName, new Set(recipe.props ?? []))

          recipe.jsx.forEach((jsx) => {
            if (typeof jsx === 'string') {
              acc.string.add(jsx)
            } else {
              acc.regex.push(jsx)
            }
          })

          return acc
        }, initialRecipes)
      : initialRecipes

    const cvaAlias = imports.getAlias('cva')
    const cssAlias = imports.getAlias('css')
    const svaAlias = imports.getAlias('sva')

    if (context.jsx) {
      context.jsx.nodes.forEach((node) => {
        const alias = imports.getAlias(node.jsxName)
        node.props?.forEach((prop) => propertiesMap.set(prop, true))

        functions.set(node.baseName, propertiesMap)
        functions.set(alias, propertiesMap)
        components.set(alias, propertiesMap)
      })
    }

    const isJsxTagRecipe = isJsxEnabled
      ? memo(
          (tagName: string) =>
            recipeJsxLists.string.has(tagName) || recipeJsxLists.regex.some((regex) => regex.test(tagName)),
        )
      : noop

    const isJsxTagPattern = isJsxEnabled
      ? memo(
          (tagName: string) =>
            patternJsxLists.string.has(tagName) || patternJsxLists.regex.some((regex) => regex.test(tagName)),
        )
      : noop

    const matchTag = isJsxEnabled
      ? memo((tagName: string) => {
          // ignore fragments
          if (!tagName) return false

          return (
            components.has(tagName) ||
            isUpperCase(tagName) ||
            isFactory(tagName) ||
            isJsxTagRecipe(tagName) ||
            isJsxTagPattern(tagName)
          )
        })
      : noop

    const isRecipeOrPatternProp = memo((tagName: string, propName: string) => {
      if (isJsxEnabled && isJsxTagRecipe(tagName)) {
        const recipeList = getRecipesByJsxName(tagName)
        return recipeList.some((recipe) => recipePropertiesByJsxName.get(recipe.jsxName)?.has(propName))
      }

      if (isJsxEnabled && isJsxTagPattern(tagName)) {
        const patternList = getPatternsByJsxName(tagName)
        return patternList.some((pattern) => patternPropertiesByJsxName.get(pattern.jsxName)?.has(propName))
      }

      return false
    })

    const matchTagProp = isJsxEnabled
      ? match(jsx.styleProps)
          .with('all', () =>
            memo((tagName: string, propName: string) => {
              return (
                Boolean(components.get(tagName)?.has(propName)) ||
                isValidProperty(propName) ||
                propertiesMap.has(propName) ||
                isRecipeOrPatternProp(tagName, propName)
              )
            }),
          )
          .with('minimal', () =>
            memo((tagName: string, propName: string) => {
              return propName === 'css' || isRecipeOrPatternProp(tagName, propName)
            }),
          )
          .with('none', () => memo((tagName: string, propName: string) => isRecipeOrPatternProp(tagName, propName)))
          .exhaustive()
      : noop

    const matchFn = memo((fnName: string) => {
      if (recipes.has(fnName) || patterns.has(fnName)) return true
      if (fnName === cvaAlias || fnName === cssAlias || fnName === svaAlias || isRawFn(fnName) || isFactory(fnName))
        return true
      return functions.has(fnName)
    })

    const measure = logger.time.debug(`Tokens extracted from ${filePath}`)

    const extractResultByName = extract({
      ast: sourceFile,
      components: isJsxEnabled
        ? {
            matchTag: (prop) => !!matchTag(prop.tagName),
            matchProp: (prop) => !!matchTagProp(prop.tagName, prop.propName),
          }
        : undefined,
      functions: {
        matchFn: (prop) => matchFn(prop.fnName),
        matchProp: () => true,
        matchArg: (prop) => {
          // skip resolving `badge` here: `panda("span", badge)`
          if (prop.fnName === jsxFactoryAlias && prop.index === 1 && Node.isIdentifier(prop.argNode)) return false
          return true
        },
      },
      taggedTemplates:
        syntax === 'template-literal' ? { matchTaggedTemplate: (tag) => matchFn(tag.fnName) } : undefined,
      getEvaluateOptions: (node) => {
        if (!Node.isCallExpression(node)) return evaluateOptions
        const propAccessExpr = node.getExpression()

        if (!Node.isPropertyAccessExpression(propAccessExpr)) return evaluateOptions
        let name = propAccessExpr.getText()

        if (!isRawFn(name as string)) {
          return evaluateOptions
        }

        name = name.replace('.raw', '')

        return {
          environment: Object.assign({}, defaultEnv, { extra: { [name]: { raw: identityFn } } }),
        }
      },
      flags: { skipTraverseFiles: true },
    })

    measure()

    extractResultByName.forEach((result, alias) => {
      let name = alias
      if (isRawFn(name)) name = name.replace('.raw', '')
      name = imports.getName(name)

      logger.debug(`ast:${name}`, name !== alias ? { kind: result.kind, alias } : { kind: result.kind })

      if (result.kind === 'function') {
        match(name)
          .when(css.match, (name: 'css' | 'cva' | 'sva') => {
            // css({ ... }), cva({ ... }), sva({ ... })
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression') {
                // css({ ... }, { ... })
                if (query.box.value.length > 1) {
                  parserResult.set(name, {
                    name,
                    box: query.box,
                    data: query.box.value.reduce(
                      (acc, value) => [...acc, ...combineResult(unbox(value))],
                      [] as Array<Unboxed['raw']>,
                    ),
                  })
                } else {
                  // css({ ... })
                  parserResult.set(name, {
                    name,
                    box: (query.box.value[0] as BoxNodeMap) ?? fallback(query.box),
                    data: combineResult(unbox(query.box.value[0])),
                  })
                }
                //
              } else if (query.kind === 'tagged-template') {
                // css` ... `
                const obj = astish(query.box.value as string)
                parserResult.set(name, {
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
                parserResult.setPattern(name, {
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
                parserResult.setRecipe(name, {
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
                const boxNode = box.isMap(map) ? map : fallback(query.box)
                // ensure that data is always an object
                const result = { name, box: boxNode, data: combineResult(unbox(boxNode)) } as ResultItem

                // CallExpression factory inline recipe
                // panda("span", { base: {}, variants: { ... } })
                if (box.isMap(map) && isCva(map.value)) {
                  parserResult.setCva(result)
                } else {
                  // CallExpression factory css
                  // panda("span", { color: "red.100", ... })
                  parserResult.set('css', result)
                }

                // panda("div", badge, { ... })
                const options = query.box.value[2]
                if (box.isUnresolvable(map) && options && box.isMap(options) && options.value.has('defaultProps')) {
                  const maybeIdentifier = map.getNode()

                  if (Node.isIdentifier(maybeIdentifier)) {
                    const name = maybeIdentifier.getText()
                    const recipeName = imports.getName(name)

                    // set it as JSX-recipe so that recipe & style props will be split correctly
                    parserResult.setRecipe(recipeName, {
                      type: 'jsx-recipe',
                      name: recipeName,
                      box: options,
                      data: combineResult(unbox(options.value.get('defaultProps'))),
                    })
                  }
                }
              } else if (query.kind === 'tagged-template') {
                // TaggedTemplateExpression factory css
                // panda('span')` color: red; `
                const obj = astish(query.box.value as string)
                parserResult.set('css', {
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
                const boxNode = box.isMap(map) ? map : fallback(query.box)
                // ensure that data is always an object
                const result = { name, box: boxNode, data: combineResult(unbox(boxNode)) } as ResultItem

                // PropertyAccess factory inline recipe
                // panda.span({ base: {}, variants: { ... } })
                if (box.isMap(map) && isCva(map.value)) {
                  parserResult.setCva(result)
                } else {
                  // PropertyAccess factory css
                  // panda.span({ ... })
                  parserResult.set('css', result)
                }
              } else if (query.kind === 'tagged-template') {
                const obj = astish(query.box.value as string)
                parserResult.set('css', {
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
      } else if (isJsxEnabled && result.kind === 'component') {
        //
        result.queryList.forEach((query) => {
          //
          const data = combineResult(unbox(query.box))

          match(name)
            .when(isFactory, (jsxName) => {
              parserResult.setJsx({ name: jsxName, box: query.box, type: 'jsx-factory', data })
            })
            .when(isJsxTagPattern, (jsxName) => {
              parserResult.setPattern(jsxName, { type: 'jsx-pattern', name: jsxName, box: query.box, data })
            })
            .when(isJsxTagRecipe, (jsxName) => {
              const recipeList = getRecipesByJsxName(jsxName)
              recipeList.map((recipe) => {
                parserResult.setRecipe(recipe.baseName, { type: 'jsx-recipe', name: jsxName, box: query.box, data })
              })
            })
            .otherwise(() => {
              parserResult.setJsx({ name, box: query.box, type: 'jsx', data })
            })
        })
      }
    })

    // console.log(parserResult.toJSON().css)
    return parserResult
  }
}

const isUpperCase = (value: string) => value[0] === value[0]?.toUpperCase()
