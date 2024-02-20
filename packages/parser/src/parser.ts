import type { ImportResult, ParserOptions } from '@pandacss/core'
import { BoxNodeMap, box, extract, unbox, type EvaluateOptions, type Unboxed } from '@pandacss/extractor'
import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { astish } from '@pandacss/shared'
import type { ParserResultConfigureOptions, ResultItem } from '@pandacss/types'
import type { SourceFile } from 'ts-morph'
import { Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { getImportDeclarations } from './get-import-declarations'
import { ParserResult } from './parser-result'

const combineResult = (unboxed: Unboxed) => {
  return [...unboxed.conditions, unboxed.raw, ...unboxed.spreadConditions]
}

const defaultEnv: EvaluateOptions['environment'] = {
  preset: 'ECMA',
}

const evaluateOptions: EvaluateOptions = {
  environment: defaultEnv,
}

export function createParser(context: ParserOptions) {
  const { jsx, imports, recipes, syntax } = context

  return function parse(
    sourceFile: SourceFile | undefined,
    encoder?: Generator['encoder'],
    options?: ParserResultConfigureOptions,
  ) {
    if (!sourceFile) return

    const importDeclarations: ImportResult[] = getImportDeclarations(context, sourceFile)

    const file = imports.file(importDeclarations)

    const filePath = sourceFile.getFilePath()

    logger.debug(
      'ast:import',
      !file.isEmpty() ? `Found import { ${file.toString()} } in ${filePath}` : `No import found in ${filePath}`,
    )

    const parserResult = new ParserResult(context, encoder)

    if (file.isEmpty() && !jsx.isEnabled) {
      return parserResult
    }

    const extractResultByName = extract({
      ast: sourceFile,
      components: jsx.isEnabled
        ? {
            matchTag: (prop) => {
              if (options?.matchTag) {
                // If the user has a custom matchTag function,
                // we're not going to match every uppercased tag
                const isPandaComponent = file.isPandaComponent(prop.tagName)
                return isPandaComponent || options.matchTag(prop.tagName, isPandaComponent)
              }

              return !!file.matchTag(prop.tagName)
            },
            matchProp: (prop) => {
              const isPandaProp = file.matchTagProp(prop.tagName, prop.propName)

              if (options?.matchTagProp) {
                return isPandaProp && options.matchTagProp(prop.tagName, prop.propName)
              }

              return isPandaProp
            },
          }
        : undefined,
      functions: {
        matchFn: (prop) => file.matchFn(prop.fnName),
        matchProp: () => true,
        matchArg: (prop) => {
          // skip resolving `badge` here: `panda("span", badge)`
          if (file.isJsxFactory(prop.fnName) && prop.index === 1 && Node.isIdentifier(prop.argNode)) return false
          return true
        },
      },
      taggedTemplates:
        syntax === 'template-literal'
          ? {
              matchTaggedTemplate: (tag) => file.matchFn(tag.fnName),
            }
          : undefined,
      getEvaluateOptions: (node) => {
        if (!Node.isCallExpression(node)) return evaluateOptions
        const propAccessExpr = node.getExpression()

        if (!Node.isPropertyAccessExpression(propAccessExpr)) return evaluateOptions
        let name = propAccessExpr.getText()

        if (!file.isRawFn(name as string)) {
          return evaluateOptions
        }

        name = name.replace('.raw', '')

        return {
          environment: Object.assign({}, defaultEnv, {
            extra: {
              [name]: { raw: (v: any) => v },
            },
          }),
        }
      },
      flags: { skipTraverseFiles: true },
    })

    extractResultByName.forEach((result, alias) => {
      //
      const name = file.getName(file.normalizeFnName(alias))

      logger.debug(`ast:${name}`, name !== alias ? { kind: result.kind, alias } : { kind: result.kind })

      if (result.kind === 'function') {
        match(name)
          .when(imports.matchers.css.match, (name: 'css' | 'cva' | 'sva') => {
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
                    box: (query.box.value[0] as BoxNodeMap) ?? box.fallback(query.box),
                    data: combineResult(unbox(query.box.value[0])),
                  })
                }
                //
              } else if (query.kind === 'tagged-template') {
                // css` ... `
                const obj = astish(query.box.value as string)
                parserResult.set(name, {
                  name,
                  box: query.box ?? box.fallback(query.box),
                  data: [obj],
                })
              }
            })
          })
          // stack({ ... })
          .when(file.isValidPattern, (name) => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression') {
                parserResult.setPattern(name, {
                  name,
                  box: (query.box.value[0] as BoxNodeMap) ?? box.fallback(query.box),
                  data: combineResult(unbox(query.box.value[0])),
                })
              }
            })
          })
          // button({ ... })
          .when(file.isValidRecipe, (name) => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression') {
                parserResult.setRecipe(name, {
                  name,
                  box: (query.box.value[0] as BoxNodeMap) ?? box.fallback(query.box),
                  data: combineResult(unbox(query.box.value[0])),
                })
              }
            })
          })
          // panda("span", { ... }) or panda("div", badge)
          // or panda("span", { color: "red.100", ... })
          // or panda('span')` color: red; `
          .when(jsx.isJsxFactory, () => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression' && query.box.value[1]) {
                const map = query.box.value[1]
                const boxNode = box.isMap(map) ? map : box.fallback(query.box)
                // ensure that data is always an object
                const result = { name, box: boxNode, data: combineResult(unbox(boxNode)) } as ResultItem

                // CallExpression factory inline recipe
                // panda("span", { base: {}, variants: { ... } })
                if (box.isRecipe(map)) {
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
                    const recipeName = file.getName(name)

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
                  box: query.box ?? box.fallback(query.box),
                  data: [obj],
                })
              }
            })
          })
          // panda.span({ ... }) or panda.div` ...`
          .when(file.isJsxFactory, (name) => {
            result.queryList.forEach((query) => {
              if (query.kind === 'call-expression') {
                const map = query.box.value[0]
                const boxNode = box.isMap(map) ? map : box.fallback(query.box)
                // ensure that data is always an object
                const result = { name, box: boxNode, data: combineResult(unbox(boxNode)) } as ResultItem

                // PropertyAccess factory inline recipe
                // panda.span({ base: {}, variants: { ... } })
                if (box.isRecipe(map)) {
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
                  box: query.box ?? box.fallback(query.box),
                  data: [obj],
                })
              }
            })
          })
          .otherwise(() => {
            //
          })
        //
      } else if (jsx.isEnabled && result.kind === 'component') {
        //
        result.queryList.forEach((query) => {
          //
          const data = combineResult(unbox(query.box))

          switch (true) {
            case file.isJsxFactory(name): {
              parserResult.setJsx({ type: 'jsx-factory', name: name, box: query.box, data })
              break
            }
            case jsx.isJsxTagPattern(name): {
              parserResult.setPattern(name, { type: 'jsx-pattern', name: name, box: query.box, data })
              break
            }
            case jsx.isJsxTagRecipe(name): {
              const matchingRecipes = recipes.filter(name)
              matchingRecipes.map((recipe) => {
                parserResult.setRecipe(recipe.baseName, { type: 'jsx-recipe', name: name, box: query.box, data })
              })
              break
            }
            default: {
              parserResult.setJsx({ type: 'jsx', name, box: query.box, data })
            }
          }
        })
      }
    })

    return parserResult
  }
}
