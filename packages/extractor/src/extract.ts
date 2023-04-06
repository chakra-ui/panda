import { Bool, Obj, Opt, cast, pipe } from 'lil-fp'
import { JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'
import { match } from 'ts-pattern'
import { box } from './box'
import { BoxNodeMap, BoxNodeObject, type BoxNode, type MapTypeValue } from './box-factory'
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

type QueryComponentMap = Map<JsxOpeningElement | JsxSelfClosingElement, { name: string; props: MapTypeValue }>

const isJsxElement = Bool.or(Node.isJsxOpeningElement, Node.isJsxSelfClosingElement)
const isImportOrExport = Bool.or(Node.isImportDeclaration, Node.isExportDeclaration)

const doNothing = () => void 0

export const extract = ({ ast, ...ctx }: ExtractOptions) => {
  // contains all the extracted nodes from this ast parsing
  // whereas `extractMap` is the global map that could be populated by this function in multiple `extract` calls
  const localExtraction = new Map() as ExtractResultByName
  const queryComponentMap = new Map() as QueryComponentMap

  const visitedComponentFromSpreadList = new WeakSet<Node>()
  const { components, functions } = ctx

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

      // skip re-extracting nested spread attribute
      if (visitedComponentFromSpreadList.has(componentNode)) {
        traversal.skip()
        return
      }

      visitedComponentFromSpreadList.add(componentNode)

      const componentName = getComponentName(componentNode)
      const isFactory = componentName.includes('.')

      if (!components.matchTag({ tagNode: componentNode, tagName: componentName, isFactory })) {
        return
      }

      if (!localExtraction.has(componentName)) {
        localExtraction.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
      }

      const localNodes = localExtraction.get(componentName)!.nodesByProp

      if (!queryComponentMap.has(componentNode)) {
        queryComponentMap.set(componentNode, { name: componentName, props: new Map() })
      }

      const matchProp = ({ propName, propNode }: MatchPropArgs) =>
        components.matchProp({ tagNode: componentNode, tagName: componentName, propName, propNode })

      const spreadNode = extractJsxSpreadAttributeValues(node, ctx, cast(matchProp))
      const parentRef = queryComponentMap.get(componentNode)!

      // increment count since there might be conditional
      // so it doesn't override the whole spread prop
      let count = 0
      const propSizeAtThisPoint = parentRef.props.size
      const getSpreadPropName = () => `_SPREAD_${propSizeAtThisPoint}_${count++}`

      const processObjectLike = (objLike: BoxNodeMap | BoxNodeObject) => {
        const mapValue = objectLikeToMap(objLike, node)
        const boxed = box.map(mapValue, node, [componentNode])

        if (box.isMap(objLike) && objLike.spreadConditions?.length) {
          boxed.spreadConditions = objLike.spreadConditions
        }

        parentRef.props.set(getSpreadPropName(), boxed)

        const entries = mergeSpreads({
          map: mapValue,
          // if the boxNode is an object
          // that means it was evaluated so we need to filter its props
          // otherwise, it was already filtered in extractJsxSpreadAttributeValues
          matchProp: box.isObject(objLike) ? (matchProp as any) : undefined,
        })

        entries.forEach(([propName, propValue]) => {
          localNodes.set(propName, (localNodes.get(propName) ?? []).concat(propValue))
        })
      }

      const processBoxNode = (boxNode: BoxNode) => {
        return match(boxNode)
          .when(box.isUnresolvable, doNothing)
          .when(box.isConditional, (boxNode) => {
            processBoxNode(boxNode.whenTrue)
            processBoxNode(boxNode.whenFalse)
          })
          .when(box.isLiteral, (boxNode) => {
            if (boxNode.kind === 'null' || boxNode.kind === 'undefined') {
              parentRef.props.set(getSpreadPropName(), boxNode)
            }
          })
          .when(Bool.or(box.isObject, box.isMap), (boxNode) => {
            processObjectLike(boxNode)
          })
          .run()
      }

      //@ts-ignore
      processBoxNode(spreadNode)

      return
    }

    if (components && Node.isJsxAttribute(node)) {
      // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
      //           ^^^^^           ^^^^^^^^^^^^^^^

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
              if (!localExtraction.has(componentName)) {
                localExtraction.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
              }
              const localNodes = localExtraction.get(componentName)!.nodesByProp
              localNodes.set(propName, (localNodes.get(propName) ?? []).concat(maybeBox))
            }),
            Opt.tap((maybeBox) => {
              if (!queryComponentMap.has(componentNode)) {
                queryComponentMap.set(componentNode, { name: componentName, props: new Map() })
              }
              const parentRef = queryComponentMap.get(componentNode)!
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
      // console.log({ objectOrMapType });

      if (!localExtraction.has(fnName)) {
        localExtraction.set(fnName, { kind: 'function', nodesByProp: new Map(), queryList: [] })
      }

      const localFnMap = localExtraction.get(fnName)! as ExtractedFunctionResult

      const localNodes = localFnMap.nodesByProp
      const localList = localFnMap.queryList

      const nodeList = extractCallExpressionArguments(node, ctx, matchProp, functions.matchArg).value.map((boxNode) => {
        if (box.isObject(boxNode) || box.isMap(boxNode)) {
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
          })

          entries.forEach(([propName, propValue]) => {
            localNodes.set(propName, (localNodes.get(propName) ?? []).concat(propValue))
          })

          return box.map(mapAfterSpread, node, boxNode.getStack())
        }

        return boxNode
      })

      const query = { name: fnName, box: box.list(nodeList, node, []) } as ExtractedFunctionInstance
      localList.push(query)
    }
  })

  queryComponentMap.forEach((parentRef, componentNode) => {
    const componentName = parentRef.name
    const localList = (localExtraction.get(componentName)! as ExtractedComponentResult).queryList
    const query = cast<ExtractedComponentInstance>({
      name: parentRef.name,
      box: box.map(parentRef.props, componentNode, []),
    })
    localList.push(query)
  })

  return localExtraction
}

/**
 * reverse prop entries so that the last one wins
 * @example <Box sx={{ ...{ color: "red" }, color: "blue" }} />
 * // color: "blue" wins / color: "red" is ignored
 */
function mergeSpreads({ map, matchProp }: { map: MapTypeValue; matchProp?: (prop: MatchFnPropArgs) => boolean }) {
  if (map.size <= 1) return Array.from(map.entries())

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
