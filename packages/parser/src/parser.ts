import type { ImportResult, ParserOptions } from '@pandacss/core'
import {
  BoxNodeMap,
  box,
  extract,
  unbox,
  type EvaluateOptions,
  type Unboxed,
  type BoxNode,
  BoxNodeUnresolvable,
} from '@pandacss/extractor'
import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { astish } from '@pandacss/shared'
import type { ParserResultConfigureOptions, ResultItem, JsxFactoryResultTransform } from '@pandacss/types'
import type { SourceFile } from 'ts-morph'
import { Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { getImportDeclarations } from './get-import-declarations'
import { ParserResult } from './parser-result'

const combineResult = (unboxed: Unboxed) => {
  return [...(unboxed.conditions ?? []), unboxed.raw, ...(unboxed.spreadConditions ?? [])]
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
    options?: ParserResultConfigureOptions & Partial<JsxFactoryResultTransform>,
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

    const unresolveds = parserResult.unresolveds

    const getData = (box: BoxNode | undefined): ReturnType<typeof combineResult> => {
      if (!box) return undefinedFallback

      const unboxed = unbox(box)

      if (unboxed.unresolved?.length) {
        unboxed.unresolved.forEach((n) => unresolveds.add(n))
      }

      return combineResult(unboxed)
    }

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
                      (acc, value) => [...acc, ...getData(value)],
                      [] as Array<Unboxed['raw']>,
                    ),
                  })
                } else {
                  // css({ ... })
                  parserResult.set(name, {
                    name,
                    box: (query.box.value[0] as BoxNodeMap) ?? box.fallback(query.box),
                    data: getData(query.box.value[0]),
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
                  data: getData(query.box.value[0]),
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
                  data: getData(query.box.value[0]),
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

                const combined = getData(boxNode)
                const transformed = options?.transform?.({ type: 'jsx-factory', data: combined })

                // ensure that data is always an object
                const result = { name, box: boxNode, data: transformed ?? combined } as ResultItem

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
                const recipeOptions = query.box.value[2]
                if (
                  box.isUnresolvable(map) &&
                  recipeOptions &&
                  box.isMap(recipeOptions) &&
                  recipeOptions.value.has('defaultProps')
                ) {
                  const maybeIdentifier = map.getNode()

                  if (Node.isIdentifier(maybeIdentifier)) {
                    const name = maybeIdentifier.getText()
                    const recipeName = file.getName(name)

                    // set it as JSX-recipe so that recipe & style props will be split correctly
                    parserResult.setRecipe(recipeName, {
                      type: 'jsx-recipe',
                      name: recipeName,
                      box: recipeOptions,
                      data: getData(recipeOptions.value.get('defaultProps')),
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

                const combined = getData(boxNode)
                const transformed = options?.transform?.({ type: 'jsx-factory', data: combined })

                // ensure that data is always an object
                const result = { name, box: boxNode, data: transformed ?? combined } as ResultItem

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
          const data = getData(query.box)

          switch (true) {
            case file.isJsxFactory(name) || file.isJsxFactory(alias): {
              parserResult.setJsx({ type: 'jsx-factory', name: name, box: query.box, data })
              break
            }
            case jsx.isJsxTagPattern(name) || jsx.isJsxTagPattern(alias): {
              parserResult.setPattern(name, { type: 'jsx-pattern', name: name, box: query.box, data })
              break
            }
            // name: Trigger
            case jsx.isJsxTagRecipe(name): {
              const matchingRecipes = recipes.filter(name)
              matchingRecipes.map((recipe) => {
                parserResult.setRecipe(recipe.baseName, { type: 'jsx-recipe', name: name, box: query.box, data })
              })
              break
            }
            // alias: Tabs.Trigger
            case jsx.isJsxTagRecipe(alias): {
              const matchingRecipes = recipes.filter(alias)
              matchingRecipes.map((recipe) => {
                parserResult.setRecipe(recipe.baseName, { type: 'jsx-recipe', name: alias, box: query.box, data })
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

    if (unresolveds.size) {
      // console.log('unresolveds', unresolvedsFalsePositives)

      const list = Array.from(unresolveds)
        .filter((n) => {
          const node = n.getNode()

          // TODO do we make this a bit more sophisticated (check for component-like parents) and keep it ?
          // ASSUMPTION: binding elements are most likely used in JSX to pass props
          // it's better to treat them as false positives
          // ex:
          // function Button({ children, variant, size, css: cssProp }: ButtonProps) {
          //   return <button className={cx(button({ variant, size }), css(cssProp))}>{children}</button>
          // }
          if (Node.isBindingElement(node)) {
            console.log(node.getKindName(), node.getText())
            console.log(n.getStack().map((n) => [n.getKindName(), n.getText()]))
            // return
          }

          // Ignore `styled` JSX factory
          // we don't need to evaluate it but only to extract the arguments
          // styled.div({ color: 'red.400' })
          // styled("button", { color: "red.400" })
          if (Node.isCallExpression(node)) {
            const name = node.getExpression().getText()
            if (file.isJsxFactory(name)) return
          }

          // Specifically ignore unresolved sva `slots`, it's not needed
          // import { slots, slots as arkSlots } from './slots'
          // `sva({ slots })` | `sva({ slots: arkSlots })`
          if (Node.isIdentifier(node)) {
            const stack = n.getStack()
            const first = stack.at(0)
            const slots = stack.find((n) => {
              if (Node.isPropertyAccessExpression(n) && n.getName() === 'slots') {
                return true
              }

              if (Node.isShorthandPropertyAssignment(n) && n.getName() === 'slots') {
                return true
              }
            })

            if (slots && first && Node.isCallExpression(first)) {
              const name = first.getExpression().getText()
              if (name === 'sva' || file.isAliasFnName(name)) return
            }
          }

          return true
        })
        .map((n) => {
          const node = n.getNode()

          const range = n.getRange()
          return `\`${node.getText()}\` at ${node.getSourceFile().getFilePath()}:${range.startLineNumber}:${range.startColumn}:${range.endLineNumber}:${range.endColumn}`
        })

      if (list.length) {
        logger.warn('extractor', `Some values could not be statically extracted: \n` + list.join('\n') + '\n')
      }
    }

    return parserResult
  }
}

const undefinedFallback = [{}]
