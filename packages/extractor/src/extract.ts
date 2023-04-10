import { Arr, Bool, Obj, Opt, cast, noop, pipe } from 'lil-fp'
import { JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { box } from './box'
import { BoxNodeMap, BoxNodeObject, type BoxNode, type MapTypeValue, BoxNodeConditional } from './box-factory'
import { extractCallExpressionArguments } from './call-expression'
import { extractJsxAttribute } from './jsx-attribute'
import { extractJsxSpreadAttributeValues } from './jsx-spread-attribute'
import { objectLikeToMap } from './object-like-to-map'
import type {
  ExtractOptions,
  ExtractResultByName,
  ExtractedComponentInstance,
  ExtractedComponentResult,
  ExtractedFunctionInstance,
  ExtractedFunctionResult,
  MatchFnPropArgs,
  MatchPropArgs,
} from './types'
import { getComponentName } from './utils'

type JsxElement = JsxOpeningElement | JsxSelfClosingElement
type ComponentMap = Map<JsxElement, { name: string; props: MapTypeValue; spreads: BoxNodeMap[] }>

const isJsxElement = Bool.or(Node.isJsxOpeningElement, Node.isJsxSelfClosingElement)
const isImportOrExport = Bool.or(Node.isImportDeclaration, Node.isExportDeclaration)

export const extract = ({ ast, ...ctx }: ExtractOptions) => {
  const { components, functions } = ctx

  // contains all the extracted nodes from this ast parsing
  const result: ExtractResultByName = new Map()
  const componentMap: ComponentMap = new Map()

  const visitedComponentFromSpread = new WeakSet<Node>()
  const spreadByComponent = new WeakMap<JsxElement, { props: MapTypeValue; conditionals: BoxNodeConditional[] }>()

  ast.forEachDescendant((node, traversal) => {
    // quick win
    if (isImportOrExport(node)) {
      traversal.skip()
      return
    }

    if (components && Node.isJsxSpreadAttribute(node)) {
      // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
      //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

      const componentNode = node.getFirstAncestor(isJsxElement)
      if (!componentNode) return

      // skip re-extracting nested spread attribute, already extracted from the parent spread
      // <ColorBox {...{ color: "facebook.100", ...{ backgroundColor: "facebook.200" } }}>spread</ColorBox>
      //                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      if (visitedComponentFromSpread.has(componentNode)) {
        traversal.skip()
        return
      }

      visitedComponentFromSpread.add(componentNode)

      const componentName = getComponentName(componentNode)
      const isFactory = componentName.includes('.')

      if (!components.matchTag({ tagNode: componentNode, tagName: componentName, isFactory })) {
        return
      }

      if (!result.has(componentName)) {
        result.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
      }

      const boxByProp = result.get(componentName)!.nodesByProp

      if (!componentMap.has(componentNode)) {
        componentMap.set(componentNode, { name: componentName, props: new Map(), spreads: [] })
      }

      const matchProp = ({ propName, propNode }: MatchPropArgs) =>
        components.matchProp({ tagNode: componentNode, tagName: componentName, propName, propNode })

      const spreadNode = extractJsxSpreadAttributeValues(node, ctx, cast(matchProp))
      if (!spreadNode) return

      // <ColorBox padding="4" {...{ color: "facebook.100" }} margin={2} />
      // the parent ref contains the props that were already extracted from the jsx attributes (not spread)
      // so we can merge the spread props with those extracted props
      const parentRef = componentMap.get(componentNode)!

      if (!spreadByComponent.has(componentNode)) {
        spreadByComponent.set(componentNode, { props: new Map(), conditionals: [] })
      }
      const spread = spreadByComponent.get(componentNode)!

      // TODO keep track of the JsxAttributes[element] index (including spread) to keep track of the order before & after the spread
      // so we know which props can be overriden and avoid generating styles for those that were overriden

      const processObjectLike = (objLike: BoxNodeMap | BoxNodeObject, isRootConditional?: boolean) => {
        const mapValue = objectLikeToMap(objLike, node)
        const boxNode = box.map(mapValue, node, [componentNode])

        if (box.isMap(objLike) && objLike.spreadConditions?.length) {
          boxNode.spreadConditions = objLike.spreadConditions
        }

        const entries = mergeSpreads({
          map: mapValue,
          // if the boxNode is an object
          // that means it was evaluated so we need to filter its props
          // otherwise, it was already filtered in extractJsxSpreadAttributeValues
          matchProp: box.isObject(objLike) ? (matchProp as any) : undefined,
        })

        // <ColorBox {...(someCondition && { color: "facebook.100" })} />
        if (isRootConditional) {
          const boxMap = box.map(spread.props, node, boxNode.getStack())
          if (box.isMap(boxNode) && boxNode.spreadConditions?.length) {
            boxMap.spreadConditions = boxNode.spreadConditions
          }
          parentRef.spreads.push(boxMap)

          return boxNode
        }

        entries.forEach(([propName, propValue]) => {
          spread.props.set(propName, propValue)
          boxByProp.set(propName, (boxByProp.get(propName) ?? []).concat(propValue))
        })
      }

      const processBoxNode = (boxNode: BoxNode, isRootConditional?: boolean) => {
        return match(boxNode)
          .when(box.isConditional, (boxNode) => {
            // when isRootConditional = true, i'm not sure if we even need to call processBoxNode on whenTrue & whenFalse
            // we could maybe just push the boxNode as is in spread.conditionals ?
            const whenTrue = processBoxNode(boxNode.whenTrue, isRootConditional)
            const whenFalse = processBoxNode(boxNode.whenFalse, isRootConditional)

            if (whenTrue && whenFalse) {
              spread.conditionals.push(
                box.conditional(whenTrue, whenFalse, boxNode.getNode(), boxNode.getStack(), boxNode.kind),
              )
            }
          })
          .when(Bool.or(box.isObject, box.isMap), (boxNode) => {
            return processObjectLike(boxNode, isRootConditional)
          })
          .otherwise(noop)
      }

      processBoxNode(spreadNode, box.isConditional(spreadNode))

      return
    }

    if (components && Node.isJsxAttribute(node)) {
      // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
      //           ^^^^^           ^^^^^^^^^^^^^^^

      // TODO keep track of the JsxAttributes[element] index (including spread) to keep track of the order before & after the spread
      // so we know which props can be overriden and avoid generating styles for those that were overriden

      pipe(
        node.getFirstAncestor(isJsxElement),
        Opt.fromNullable,
        Opt.map((componentNode) => {
          const componentName = getComponentName(componentNode)
          const isFactory = componentName.includes('.')
          return { componentNode, componentName, isFactory }
        }),
        Opt.filter(({ componentName, componentNode, isFactory }) =>
          components.matchTag({ tagNode: componentNode, tagName: componentName, isFactory }),
        ),
        Opt.map(Obj.assign({ propName: node.getNameNode().getText() })),
        Opt.filter(({ propName, componentNode, componentName }) =>
          components.matchProp({ tagNode: componentNode, tagName: componentName, propName, propNode: node }),
        ),
        Opt.tap(({ propName, componentNode, componentName }) => {
          pipe(
            extractJsxAttribute(node, ctx),
            Opt.fromNullable,
            Opt.tap((maybeBox) => {
              if (!result.has(componentName)) {
                result.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
              }
              const boxByProp = result.get(componentName)!.nodesByProp
              boxByProp.set(propName, (boxByProp.get(propName) ?? []).concat(maybeBox))
            }),
            Opt.tap((maybeBox) => {
              if (!componentMap.has(componentNode)) {
                componentMap.set(componentNode, { name: componentName, props: new Map(), spreads: [] })
              }
              const parentRef = componentMap.get(componentNode)!
              parentRef.props.set(propName, maybeBox)
            }),
          )
        }),
      )
    }

    if (functions && Node.isCallExpression(node)) {
      const fnName = node.getExpression().getText()
      if (!functions.matchFn({ fnNode: node, fnName })) return

      const matchProp = ({ propName, propNode }: MatchFnPropArgs) =>
        functions.matchProp({ fnNode: node, fnName, propName, propNode })

      if (!result.has(fnName)) {
        result.set(fnName, { kind: 'function', nodesByProp: new Map(), queryList: [] })
      }

      const fnResultMap = result.get(fnName)! as ExtractedFunctionResult
      const boxByProp = fnResultMap.nodesByProp

      const boxNodeArray = extractCallExpressionArguments(node, ctx, matchProp, functions.matchArg)

      const nodeList = pipe(
        boxNodeArray.value,
        Arr.map((boxNode) =>
          match(boxNode)
            .when(Bool.or(box.isObject, box.isMap), (boxNode) => {
              const map = objectLikeToMap(boxNode, node)

              const entries = mergeSpreads({
                map,
                // if the boxNode is an object
                // that means it was evaluated so we need to filter its props
                // otherwise, it was already filtered in extractCallExpressionArguments
                matchProp: box.isObject(boxNode) ? (matchProp as any) : undefined,
              })

              const mapAfterSpread = new Map() as MapTypeValue
              entries.forEach(([propName, propValue]) => {
                mapAfterSpread.set(propName, propValue)
                boxByProp.set(propName, (boxByProp.get(propName) ?? []).concat(propValue))
              })

              const boxMap = box.map(mapAfterSpread, node, boxNode.getStack())
              if (box.isMap(boxNode) && boxNode.spreadConditions?.length) {
                boxMap.spreadConditions = boxNode.spreadConditions
              }

              return boxMap
            })
            .otherwise((boxNode) => boxNode),
        ),
      )

      const query = { name: fnName, box: box.array(nodeList, node, []) } as ExtractedFunctionInstance
      fnResultMap.queryList.push(query)
    }
  })

  componentMap.forEach((parentRef, componentNode) => {
    const componentName = parentRef.name
    const queryList = (result.get(componentName)! as ExtractedComponentResult).queryList
    const query = cast<ExtractedComponentInstance>({
      name: parentRef.name,
      box: box.map(parentRef.props, componentNode, []),
    })

    // TODO keep track of the JsxAttributes[element] index (including spread) to keep track of the order before & after the spread
    // for now spread overrides everything (sorry)

    // should have:
    // <ColorBox color="red" padding="4" {...{ color: "blue.100" }} margin={2} /> => color: "blue.100"
    // <ColorBox padding="4" {...{ color: "blue.100" }} color="red" margin={2} /> => color: "red"

    // currently have:
    // <ColorBox color="red" padding="4" {...{ color: "blue.100" }} margin={2} /> => color: "blue.100"
    // <ColorBox padding="4" {...{ color: "blue.100" }} color="red" margin={2} /> => color: "blue.100"
    const spread = spreadByComponent.get(componentNode)
    if (spread) {
      spread.props.forEach((propNode, propName) => {
        query.box.value.set(propName, propNode)
      })

      if (spread.conditionals?.length) {
        if (query.box.spreadConditions) {
          query.box.spreadConditions = query.box.spreadConditions.concat(spread.conditionals)
        } else {
          query.box.spreadConditions = spread.conditionals
        }
      }
    }

    queryList.push(query)
  })

  return result
}

/**
 * reverse prop entries so that the last one wins
 * @example <Box sx={{ ...{ color: "red" }, color: "blue" }} />
 * // color: "blue" wins / color: "red" is ignored
 */
function mergeSpreads({ map, matchProp }: { map: MapTypeValue; matchProp?: (prop: MatchFnPropArgs) => boolean }) {
  if (map.size <= 1) {
    return Array.from(map.entries())
  }

  const foundPropList = new Set<string>()

  const merged = Array.from(map.entries())
    .reverse()
    .filter(([propName, boxed]) => {
      if (matchProp && !matchProp?.({ propName, propNode: boxed.getNode() as any })) return false
      if (foundPropList.has(propName)) return false
      foundPropList.add(propName)
      return true
    })

  // reverse again to keep the original order
  return merged.reverse()
}
