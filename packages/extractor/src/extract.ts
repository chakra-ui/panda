import { CallExpression, JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'
import { box } from './box'
import { BoxNodeMap, BoxNodeObject, type BoxNode, type MapTypeValue, BoxNodeConditional } from './box-factory'
import { extractCallExpressionArguments } from './call-expression'
import { createCompiledJsxContext } from './compiled-jsx'
import { getObjectLiteralExpressionPropPairs } from './get-object-literal-expression-prop-pairs'
import { extractJsxAttribute } from './jsx-attribute'
import { extractJsxSpreadAttributeValues, type MatchProp } from './jsx-spread-attribute'
import { objectLikeToMap } from './object-like-to-map'
import type {
  ExtractOptions,
  ExtractResultByName,
  ExtractedComponentInstance,
  ExtractedComponentResult,
  ExtractedFunctionInstance,
  ExtractedFunctionResult,
  ExtractedTaggedTemplateInstance,
  MatchFnPropArgs,
  MatchPropArgs,
} from './types'
import { getComponentName, unwrapExpression } from './utils'
import { maybeBoxNode } from './maybe-box-node'

type JsxElement = JsxOpeningElement | JsxSelfClosingElement
type ComponentNode = JsxElement | CallExpression
interface Component {
  name: string
  props: MapTypeValue
  conditionals: BoxNodeConditional[]
}
type ComponentMap = Map<ComponentNode, Component>

const isImportOrExport = (node: Node) => Node.isImportDeclaration(node) || Node.isExportDeclaration(node)
const isJsxElement = (node: Node) => Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)

export const extract = ({ ast, ...ctx }: ExtractOptions) => {
  const { components, functions, taggedTemplates } = ctx
  const compiledJsx = createCompiledJsxContext(ast)

  /** contains all the extracted nodes from this ast parsing */
  const byName: ExtractResultByName = new Map()
  /**
   * associate a component node with its props and (spread) conditionals
   * since js es6 map preserve insertion order, we can use it to keep the order of the props
   * so we can keep the last one
   * ex: <ColorBox padding="4" {...{ color: "blue.100" }} color="red" margin={2} />
   * => color: "red"
   */
  const componentByNode: ComponentMap = new Map()

  const ensureComponent = (componentNode: ComponentNode, componentName: string) => {
    if (!byName.has(componentName)) {
      byName.set(componentName, { kind: 'component', nodesByProp: new Map(), queryList: [] })
    }

    if (!componentByNode.has(componentNode)) {
      componentByNode.set(componentNode, { name: componentName, props: new Map(), conditionals: [] })
    }

    return {
      component: componentByNode.get(componentNode)!,
      boxByProp: (byName.get(componentName)! as ExtractedComponentResult).nodesByProp,
    }
  }

  const addComponentProp = (
    component: Component,
    boxByProp: Map<string, BoxNode[]>,
    propName: string,
    propValue: BoxNode,
  ) => {
    component.props.set(propName, propValue)
    boxByProp.set(propName, (boxByProp.get(propName) ?? []).concat(propValue))
  }

  const processComponentObjectLike = (
    component: Component,
    boxByProp: Map<string, BoxNode[]>,
    propNode: Node,
    objLike: BoxNodeMap | BoxNodeObject,
    matchProp: (prop: MatchPropArgs) => boolean,
    trackSpreadConditions = false,
  ) => {
    if (trackSpreadConditions && box.isMap(objLike) && objLike.spreadConditions?.length) {
      component.conditionals.push(...objLike.spreadConditions)
    }

    const mapValue = objectLikeToMap(objLike, propNode)
    mapValue.forEach((propValue, propName) => {
      if (matchProp({ propName, propNode: propNode as any })) {
        addComponentProp(component, boxByProp, propName, propValue)
      }
    })
  }

  const processComponentBoxNode = (
    component: Component,
    boxByProp: Map<string, BoxNode[]>,
    propNode: Node,
    boxNode: BoxNode,
    matchProp: (prop: MatchPropArgs) => boolean,
    trackSpreadConditions = false,
  ) => {
    if (box.isConditional(boxNode)) {
      component.conditionals.push(boxNode)
      return
    }

    if (box.isObject(boxNode) || box.isMap(boxNode)) {
      processComponentObjectLike(component, boxByProp, propNode, boxNode, matchProp, trackSpreadConditions)
    }
  }

  const processCompiledPropSource = (
    componentNode: CallExpression,
    component: Component,
    boxByProp: Map<string, BoxNode[]>,
    propNode: Node,
    matchProp: (prop: MatchPropArgs) => boolean,
  ) => {
    const expression = unwrapExpression(propNode)
    const stack = [componentNode, expression] as Node[]

    if (Node.isObjectLiteralExpression(expression)) {
      const objectMap = getObjectLiteralExpressionPropPairs(expression, stack, ctx, matchProp as any)
      processComponentBoxNode(component, boxByProp, expression, objectMap, matchProp, true)
      return
    }

    if (Node.isCallExpression(expression) && compiledJsx.isMergePropsCall(expression)) {
      expression.getArguments().forEach((arg) => {
        processCompiledPropSource(componentNode, component, boxByProp, arg, matchProp)
      })
      return
    }

    const maybeValue = maybeBoxNode(expression, stack, ctx, matchProp as any)
    if (!maybeValue) return

    processComponentBoxNode(component, boxByProp, expression, maybeValue, matchProp, true)
  }

  ast.forEachDescendant((node, traversal) => {
    // quick win
    if (isImportOrExport(node)) {
      traversal.skip()
      return
    }

    if (components) {
      if (Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)) {
        const componentNode = node
        const componentName = getComponentName(componentNode)
        const isFactory = componentName.includes('.')

        if (!components.matchTag({ tagNode: componentNode, tagName: componentName, isFactory })) {
          return
        }

        ensureComponent(componentNode, componentName)
      }

      if (Node.isJsxSpreadAttribute(node)) {
        const componentNode = node.getFirstAncestor(isJsxElement) as JsxElement
        const component = componentByNode.get(componentNode)

        // <ColorBox {...{ color: "facebook.100" }}>spread</ColorBox>
        //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        if (!componentNode || !component) return

        const componentName = getComponentName(componentNode)
        const boxByProp = (byName.get(componentName)! as ExtractedComponentResult).nodesByProp

        const matchProp = ({ propName, propNode }: MatchPropArgs) =>
          components.matchProp({ tagNode: componentNode!, tagName: componentName, propName, propNode })

        const spreadNode = extractJsxSpreadAttributeValues(node, ctx, matchProp as MatchProp)
        if (!spreadNode) return

        // <ColorBox padding="4" {...{ color: "facebook.100" }} margin={2} />
        // the parent ref contains the props that were already extracted from the jsx attributes (not spread)
        // so we can merge the spread props with those extracted props

        processComponentBoxNode(component, boxByProp, node, spreadNode, matchProp)

        return
      }

      if (Node.isJsxAttribute(node)) {
        // <ColorBox color="red.200" backgroundColor="blackAlpha.100" />
        //           ^^^^^           ^^^^^^^^^^^^^^^

        const componentNode = node.getFirstAncestor(isJsxElement) as JsxElement
        const component = componentByNode.get(componentNode)

        if (!componentNode || !component) return

        const componentName = getComponentName(componentNode)
        const boxByProp = (byName.get(componentName)! as ExtractedComponentResult).nodesByProp

        const propName = node.getNameNode().getText()
        if (!components.matchProp({ tagNode: componentNode, tagName: componentName, propName, propNode: node })) {
          return
        }

        const maybeBox = extractJsxAttribute(node, ctx)
        if (!maybeBox) return

        addComponentProp(component, boxByProp, propName, maybeBox)
      }

      if (Node.isCallExpression(node)) {
        const compiledCall = compiledJsx.getCallInfo(node)
        if (compiledCall) {
          const { tagName, isFactory, propNodes } = compiledCall
          if (!components.matchTag({ tagNode: node, tagName, isFactory })) {
            return
          }

          const { component, boxByProp } = ensureComponent(node, tagName)
          const matchProp = ({ propName, propNode }: MatchPropArgs) =>
            components.matchProp({ tagNode: node, tagName, propName, propNode })

          propNodes.forEach((propNode) => {
            processCompiledPropSource(node, component, boxByProp, propNode, matchProp)
          })
        }
      }
    }

    if (functions && Node.isCallExpression(node)) {
      const expr = node.getExpression()
      const fnName = Node.isCallExpression(expr) ? expr.getExpression().getText() : expr.getText()
      if (!functions.matchFn({ fnNode: node, fnName })) return

      const matchProp = ({ propName, propNode }: MatchFnPropArgs) =>
        functions.matchProp({ fnNode: node, fnName, propName, propNode })

      if (!byName.has(fnName)) {
        byName.set(fnName, { kind: 'function', nodesByProp: new Map(), queryList: [] })
      }

      const fnResultMap = byName.get(fnName)! as ExtractedFunctionResult
      const boxByProp = fnResultMap.nodesByProp

      const boxNodeArray = extractCallExpressionArguments(node, ctx, matchProp, functions.matchArg)

      const nodeList = boxNodeArray.value.map((boxNode) => {
        if (box.isObject(boxNode) || box.isMap(boxNode)) {
          const mapValue = objectLikeToMap(boxNode, node)
          const isMap = box.isMap(boxNode)

          mapValue.forEach((propValue, propName) => {
            // if the boxNode is an object
            // that means it was evaluated so we need to filter its props
            // otherwise, it was already filtered in extractCallExpressionArguments
            if (isMap ? true : matchProp({ propName, propNode: node as any })) {
              boxByProp.set(propName, (boxByProp.get(propName) ?? []).concat(propValue))
            }
          })

          const boxMap = box.map(mapValue, node, boxNode.getStack())
          if (box.isMap(boxNode) && boxNode.spreadConditions?.length) {
            boxMap.spreadConditions = boxNode.spreadConditions
          }

          return boxMap
        }

        return boxNode
      })

      const query = {
        kind: 'call-expression',
        name: fnName,
        box: box.array(nodeList, node, []),
      } as ExtractedFunctionInstance
      fnResultMap.queryList.push(query)
    }

    if (taggedTemplates && Node.isTaggedTemplateExpression(node)) {
      const tag = node.getTag()
      // styled('span')`...` or styled.span`...`
      const fnName = Node.isCallExpression(tag) ? tag.getExpression().getText() : tag.getText()
      if (!taggedTemplates.matchTaggedTemplate({ taggedTemplateNode: node, fnName })) return

      if (!byName.has(fnName)) {
        byName.set(fnName, { kind: 'function', nodesByProp: new Map(), queryList: [] })
      }

      const fnResultMap = byName.get(fnName)! as ExtractedFunctionResult
      const query = {
        kind: 'tagged-template',
        name: fnName,
        box: maybeBoxNode(node, [], ctx),
      } as ExtractedTaggedTemplateInstance
      fnResultMap.queryList.push(query)
    }
  })

  // after traversing the whole tree
  // since we targeted the component nodes (JsxAttribute/JsxSpreadAttribute) we didnt know when we were done with a component
  // we can now reconstruct each component instance (a `query` is made of a component instance BoxNodeMap + its name)
  componentByNode.forEach((parentRef, componentNode) => {
    const component = componentByNode.get(componentNode)
    if (!component) return
    if (Node.isCallExpression(componentNode) && component.props.size === 0 && component.conditionals.length === 0)
      return

    const query = <ExtractedComponentInstance>{
      name: parentRef.name,
      box: box.map(component.props, componentNode, []),
    }

    if (component.conditionals?.length) {
      query.box.spreadConditions = component.conditionals
    }

    const componentName = parentRef.name
    const queryList = (byName.get(componentName)! as ExtractedComponentResult).queryList
    queryList.push(query)
  })

  byName.forEach((result, name) => {
    if (result.kind === 'component' && result.queryList.length === 0) {
      byName.delete(name)
    }
  })

  return byName
}
