import { JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'
import { extractCallExpressionArguments } from './call-expression'
import { extractJsxAttribute } from './jsx-attribute'
import { extractJsxSpreadAttributeValues } from './jsx-spread-attribute'
import {
  box,
  type BoxNode,
  BoxNodeMap,
  BoxNodeObject,
  castObjectLikeAsMapValue,
  type MapTypeValue,
} from './type-factory'
import type {
  ExtractedComponentInstance,
  ExtractedComponentResult,
  ExtractedFunctionInstance,
  ExtractedFunctionResult,
  ExtractOptions,
  ExtractResultByName,
  MatchFnPropArgs,
  MatchPropArgs,
} from './types'
import { getComponentName } from './utils'
import { createLogScope, logger } from '@pandacss/logger'

const scope = createLogScope('extractor:extract')

type QueryComponentMap = Map<JsxOpeningElement | JsxSelfClosingElement, { name: string; props: MapTypeValue }>

export const extract = ({ ast, extractMap = new Map(), ...ctx }: ExtractOptions) => {
  // contains all the extracted nodes from this ast parsing
  // whereas `extractMap` is the global map that could be populated by this function in multiple `extract` calls
  const localExtraction = new Map() as ExtractResultByName
  const queryComponentMap = new Map() as QueryComponentMap

  const visitedComponentFromSpreadList = new WeakSet<Node>()
  const { components, functions } = ctx

  ast.forEachDescendant((node, traversal) => {
    // quick win
    if (Node.isImportDeclaration(node) || Node.isExportDeclaration(node)) {
      traversal.skip()
      return
    }

    if (components && Node.isJsxSpreadAttribute(node)) {
      // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
      //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

      const componentNode = node.getFirstAncestor(
        (n): n is JsxOpeningElement | JsxSelfClosingElement =>
          Node.isJsxOpeningElement(n) || Node.isJsxSelfClosingElement(n),
      )
      if (!componentNode) return

      // skip re-extracting nested spread attribute
      if (visitedComponentFromSpreadList.has(componentNode)) {
        traversal.skip()
        return
      }

      visitedComponentFromSpreadList.add(componentNode)

      const componentName = getComponentName(componentNode)
      if (
        !components.matchTag({
          tagNode: componentNode,
          tagName: componentName,
          isFactory: componentName.includes('.'),
        })
      ) {
        return
      }

      if (!localExtraction.has(componentName)) {
        localExtraction.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
      }

      const localNodes = localExtraction.get(componentName)!.nodesByProp

      if (!extractMap.has(componentName)) {
        extractMap.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
      }

      const componentMap = extractMap.get(componentName)! as ExtractedComponentResult
      // console.log(componentName, componentMap);

      if (!queryComponentMap.has(componentNode)) {
        queryComponentMap.set(componentNode, { name: componentName, props: new Map() })
      }

      const matchProp = ({ propName, propNode }: MatchPropArgs) =>
        components.matchProp({ tagNode: componentNode, tagName: componentName, propName, propNode })
      const spreadNode = extractJsxSpreadAttributeValues(node, ctx, matchProp as any)
      const parentRef = queryComponentMap.get(componentNode)!

      // increment count since there might be conditional
      // so it doesn't override the whole spread prop
      let count = 0
      const propSizeAtThisPoint = parentRef.props.size
      const getSpreadPropName = () => `_SPREAD_${propSizeAtThisPoint}_${count++}`

      // TODO move to root scope
      const processObjectLike = (objLike: BoxNodeMap | BoxNodeObject) => {
        const mapValue = castObjectLikeAsMapValue(objLike, node)
        const boxed = box.map(mapValue, node, [componentNode])
        if (objLike.isMap() && objLike.spreadConditions?.length) {
          boxed.spreadConditions = objLike.spreadConditions
        }

        parentRef.props.set(getSpreadPropName(), boxed)

        const entries = mergeSpreadEntries({
          map: mapValue,
          // if the boxNode is an object
          // that means it was evaluated so we need to filter its props
          // otherwise, it was already filtered in extractJsxSpreadAttributeValues
          matchProp: objLike.isObject() ? (matchProp as any) : undefined,
        })
        entries.forEach(([propName, propValue]) => {
          logger.debug('merge-spread', { jsx: true, propName, propValue: (propValue as any).value })

          localNodes.set(propName, (localNodes.get(propName) ?? []).concat(propValue))
          componentMap.nodesByProp.set(propName, (componentMap.nodesByProp.get(propName) ?? []).concat(propValue))
        })
      }

      const processBoxNode = (boxNode: BoxNode) => {
        if (boxNode.isUnresolvable()) {
          return
        }

        if (boxNode.isConditional()) {
          processBoxNode(boxNode.whenTrue)
          processBoxNode(boxNode.whenFalse)
          return
        }

        if (boxNode.isLiteral() && (boxNode.kind === 'null' || boxNode.kind === 'undefined')) {
          parentRef.props.set(getSpreadPropName(), boxNode)
          return
        }

        // shouldnt' happen
        if (!boxNode.isObject() && !boxNode.isMap()) {
          return
        }

        processObjectLike(boxNode)
      }

      //@ts-ignore
      processBoxNode(spreadNode)

      return
    }

    if (components && Node.isJsxAttribute(node)) {
      // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
      //           ^^^^^           ^^^^^^^^^^^^^^^

      const componentNode = node.getFirstAncestor(
        (n): n is JsxOpeningElement | JsxSelfClosingElement =>
          Node.isJsxOpeningElement(n) || Node.isJsxSelfClosingElement(n),
      )
      if (!componentNode) return

      const componentName = getComponentName(componentNode)
      if (
        !components.matchTag({
          tagNode: componentNode,
          tagName: componentName,
          isFactory: componentName.includes('.'),
        })
      ) {
        return
      }

      const propName = node.getNameNode().getText()
      if (
        !components.matchProp({
          tagNode: componentNode,
          tagName: componentName,
          propName,
          propNode: node,
        })
      ) {
        return
      }
      // console.log({ componentName, propName });

      const maybeBox = extractJsxAttribute(node, ctx)
      if (!maybeBox) return

      logger.debug('extract:prop-name', { propName, maybeBox })

      if (!localExtraction.has(componentName)) {
        localExtraction.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
      }

      const localNodes = localExtraction.get(componentName)!.nodesByProp

      if (!extractMap.has(componentName)) {
        extractMap.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
      }

      const componentMap = extractMap.get(componentName)! as ExtractedComponentResult

      localNodes.set(propName, (localNodes.get(propName) ?? []).concat(maybeBox))

      if (!queryComponentMap.has(componentNode)) {
        queryComponentMap.set(componentNode, { name: componentName, props: new Map() })
      }

      const parentRef = queryComponentMap.get(componentNode)!
      parentRef.props.set(propName, maybeBox)

      const propNodes = componentMap.nodesByProp.get(propName) ?? []
      propNodes.push(maybeBox)

      if (propNodes.length > 0) {
        componentMap.nodesByProp.set(propName, propNodes)
      }
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

      if (!extractMap.has(fnName)) {
        extractMap.set(fnName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
      }

      const fnMap = extractMap.get(fnName)! as ExtractedFunctionResult
      const localFnMap = localExtraction.get(fnName)! as ExtractedFunctionResult

      const localNodes = localFnMap.nodesByProp
      const localList = localFnMap.queryList
      // console.log(componentName, componentMap);

      const nodeList = extractCallExpressionArguments(node, ctx, matchProp, functions.matchArg).value.map((boxNode) => {
        if (boxNode.isObject() || boxNode.isMap()) {
          const map = castObjectLikeAsMapValue(boxNode, node)
          const entries = mergeSpreadEntries({
            map,
            // if the boxNode is an object
            // that means it was evaluated so we need to filter its props
            // otherwise, it was already filtered in extractCallExpressionArguments
            matchProp: boxNode.isObject() ? (matchProp as any) : undefined,
          })

          const mapAfterSpread = new Map() as MapTypeValue
          entries.forEach(([propName, propValue]) => {
            mapAfterSpread.set(propName, propValue)
          })

          entries.forEach(([propName, propValue]) => {
            logger.debug('merge-spread', {
              fn: true,
              propName,
              propValue: (propValue as any).value,
            })

            localNodes.set(propName, (localNodes.get(propName) ?? []).concat(propValue))
            fnMap.nodesByProp.set(propName, (fnMap.nodesByProp.get(propName) ?? []).concat(propValue))
          })

          return box.map(mapAfterSpread, node, boxNode.getStack())
        }

        return boxNode
      })

      // TODO box.function
      const query = { name: fnName, box: box.list(nodeList, node, []) } as ExtractedFunctionInstance
      fnMap.queryList.push(query)
      localList.push(query)
    }
  })

  queryComponentMap.forEach((parentRef, componentNode) => {
    const componentName = parentRef.name
    const localList = (localExtraction.get(componentName)! as ExtractedComponentResult).queryList

    // TODO box.component
    const query = {
      name: parentRef.name,
      box: box.map(parentRef.props, componentNode, []),
    } as ExtractedComponentInstance

    localList.push(query)
  })

  return localExtraction
}

/**
 * reverse prop entries so that the last one wins
 * @example <Box sx={{ ...{ color: "red" }, color: "blue" }} />
 * // color: "blue" wins / color: "red" is ignored
 */
function mergeSpreadEntries({ map, matchProp }: { map: MapTypeValue; matchProp?: (prop: MatchFnPropArgs) => boolean }) {
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

  logger.debug(scope('merge-spread'), { extracted: map, merged })

  // reverse again to keep the original order
  return merged.reverse()
}
