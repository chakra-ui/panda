import { CompletionItem, CompletionItemKind, Position, Range } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { PandaExtensionSetup } from '../config'

import { ParserResult, RawCondition, ResultItem, SystemStyleObject } from '@pandacss/types'
import { CallExpression, JsxOpeningElement, JsxSelfClosingElement, Node, ts } from 'ts-morph'

import {
  BoxContext,
  BoxNodeArray,
  BoxNodeLiteral,
  BoxNodeMap,
  BoxNodeObject,
  PrimitiveType,
  Unboxed,
  box,
  extractCallExpressionArguments,
  extractJsxAttribute,
  maybeBoxNode,
  unbox,
} from '@pandacss/extractor'
import { type PandaContext } from '@pandacss/node'
import { walkObject } from '@pandacss/shared'
import { Bool } from 'lil-fp'
import { match } from 'ts-pattern'
import { color2kToVsCodeColor } from './color2k-to-vscode-color'
import { expandTokenFn } from './expand-token-fn'
import { extractJsxElementProps } from './extract-jsx-element-props'
import { isColor } from './is-color'
import { Token } from './types'
import { getMarkdownCss, getNodeRange, isObjectLike, nodeRangeToVsCodeRange, printTokenValue } from './utils'

type ClosestMatch = {
  range: Range
  propName: string
  propNode: BoxNodeWithValue
}
type ClosestTokenMatch = ClosestMatch & {
  kind: 'token'
  token: Token
  propValue: PrimitiveType
}

type ClosestConditionMatch = ClosestMatch & {
  kind: 'condition'
  condition: RawCondition
  propValue: Unboxed['raw']
}
type ClosestToken = ClosestTokenMatch | ClosestConditionMatch

type ClosestInstance = { tokenList: Token[]; range: Range; name: string; props: BoxNodeMap | BoxNodeObject }

type OnTokenCallback = (args: ClosestToken) => void
type BoxNodeWithValue = BoxNodeObject | BoxNodeLiteral | BoxNodeMap | BoxNodeArray
type BoxValue = BoxNodeWithValue['value']

const canEvalFn = (name: string) => name === 'css' || name === 'cx'
const mergeCx = (...args: any[]) =>
  args.filter(Boolean).reduce((acc, curr) => {
    if (typeof curr === 'object') return Object.assign(acc, curr)

    return acc
  }, {})

const boxCtx: BoxContext = {
  flags: { skipTraverseFiles: true },
  getEvaluateOptions: (node) => {
    if (!Node.isCallExpression(node)) return
    const expr = node.getExpression()
    const name = Node.isIdentifier(expr) && expr.getText()

    if (!canEvalFn(name as string)) return

    return {
      environment: {
        extra: {
          css: (styles: SystemStyleObject) => styles,
          cx: mergeCx,
        },
      },
    } as any
  },
}

const isNodeJsx = Bool.or(Node.isJsxSelfClosingElement, Node.isJsxOpeningElement)
const getNestedBoxProp = (map: BoxNodeMap, path: string[]) => {
  return path.reduce((acc, curr) => {
    if (box.isMap(acc)) return acc.value.get(curr)
    if (box.isObject(acc)) return acc.value[curr]

    return acc
  }, map as any)
}

export function setupTokensHelpers(setup: PandaExtensionSetup) {
  const versionByFilepath = new Map<string, number>()

  function getSourceFile(doc: TextDocument) {
    const ctx = setup.getContext()
    if (!ctx) return

    return ctx.project.getSourceFile(doc.uri)
  }

  /**
   * Get the local component list of local tokens.
   */
  function parseSourceFile(doc: TextDocument) {
    const ctx = setup.getContext()
    if (!ctx) return

    const project = ctx.project
    const currentFilePath = doc.uri

    if (versionByFilepath.get(currentFilePath) !== doc.version) {
      project.addSourceFile(doc.uri, doc.getText())
    }

    return project.parseSourceFile(doc.uri)
  }

  const createResultTokensGetter = (onToken: OnTokenCallback) => {
    const ctx = setup.getContext()
    if (!ctx) return () => {}

    return (result: ResultItem) => {
      const boxNode = result.box

      result.data.forEach((styles) => {
        const keys = Object.keys(styles)
        if (!keys.length) return

        walkObject(styles, (value, paths) => {
          // if value doesn't exist
          if (value == null) return

          const [prop, ..._allConditions] = ctx.conditions.shift(paths)
          const propNode = getNestedBoxProp(boxNode, paths)
          if (!box.isLiteral(propNode)) return

          const propName = ctx.utility.resolveShorthand(prop)
          const token = getTokenFromPropValue(ctx, propName, value)
          if (!token) return

          const range = nodeRangeToVsCodeRange(getNodeRange(propNode.getNode()))
          onToken?.({ kind: 'token', token, range, propName, propValue: value, propNode })
        })
      })
    }
  }

  /**
   * Get all the tokens from the document and call a callback on it.
   */
  function getFileTokens(_doc: TextDocument, parserResult: ParserResult, onToken: OnTokenCallback) {
    const ctx = setup.getContext()
    if (!ctx) return

    const onResult = createResultTokensGetter(onToken)

    parserResult.css.forEach(onResult)
    parserResult.jsx.forEach(onResult)
  }

  const getNodeAtPosition = (doc: TextDocument, position: Position) => {
    const ctx = setup.getContext()
    if (!ctx) return

    const sourceFile = getSourceFile(doc)
    if (!sourceFile) return

    const charIndex = ts.getPositionOfLineAndCharacter(sourceFile.compilerNode, position.line, position.character)
    return getDescendantAtPos(sourceFile, charIndex)
  }

  const findClosestInstance = <Return>(
    node: Node,
    stack: Node[],
    onFoundInstance: (args: Pick<ClosestInstance, 'name' | 'props'>) => Return,
  ) => {
    const ctx = setup.getContext()
    if (!ctx) return

    let current: Node | undefined = node

    return match(node)
      .when(
        () => {
          current = getFirstAncestorMatching(stack, Node.isCallExpression)
          return current
        },
        () => {
          const callExpression = current as CallExpression
          const name = callExpression.getExpression().getText()

          if (name === 'css') {
            const list = extractCallExpressionArguments(
              callExpression,
              boxCtx,
              () => true,
              (args) => args.index === 0,
            )
            const styles = list.value[0]
            if (!isObjectLike(styles)) return

            return onFoundInstance({ name, props: styles })
          }

          if (name === 'cx') {
            const list = extractCallExpressionArguments(
              callExpression,
              boxCtx,
              () => true,
              () => true,
            )
            const styles = mergeCx(
              ...list.value
                .filter((node) => isObjectLike(node))
                .map((item) => (item as BoxNodeMap | BoxNodeObject).value),
            )

            return onFoundInstance({ name, props: box.object(styles, callExpression, stack) })
          }
        },
      )
      .when(
        () => {
          current = getFirstAncestorMatching(stack, isNodeJsx)
          return current
        },
        () => {
          const componentNode = current as JsxSelfClosingElement | JsxOpeningElement
          const { name, props } = extractJsxElementProps(componentNode, boxCtx)
          if (!props.size) return

          return onFoundInstance({ name, props: box.map(props, componentNode, stack) })
        },
      )
      .otherwise(() => {
        //
        return undefined
      })
  }

  const findClosestToken = <Return>(
    node: Node,
    stack: Node[],
    onFoundToken: (args: Pick<ClosestToken, 'propName' | 'propNode'>) => Return,
  ) => {
    const ctx = setup.getContext()
    if (!ctx) return

    return match(node)
      .when(
        () => getFirstAncestorMatching(stack, Node.isPropertyAssignment),
        () => {
          const propAssignment = getFirstAncestorMatching(stack, Node.isPropertyAssignment)!
          const name = propAssignment.getName()

          const objectLiteral = getFirstAncestorMatching(stack, Node.isObjectLiteralExpression)!
          const maybeBox = maybeBoxNode(objectLiteral, [], boxCtx, (args) => args.propName === name)
          if (!box.isMap(maybeBox)) return

          const propNode = maybeBox.value.get(name)
          if (!box.hasValue(propNode)) return

          const propName = ctx.utility.resolveShorthand(name)

          return onFoundToken({ propName, propNode })
        },
      )
      .when(
        () => getFirstAncestorMatching(stack, Node.isJsxAttribute),
        () => {
          const attrNode = getFirstAncestorMatching(stack, Node.isJsxAttribute)!

          const nameNode = attrNode.getNameNode()
          const name = nameNode.getText()

          const attrBox = extractJsxAttribute(attrNode, boxCtx)
          if (!box.hasValue(attrBox)) return

          const propName = ctx.utility.resolveShorthand(name)

          return onFoundToken({ propName, propNode: attrBox })
        },
      )
      .otherwise(() => {
        //
        return undefined
      })
  }

  const getClosestToken = (doc: TextDocument, position: Position): ClosestToken | undefined => {
    const ctx = setup.getContext()
    if (!ctx) return

    const match = getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match

    return findClosestToken(node, stack, ({ propName, propNode }) => {
      if (box.isLiteral(propNode)) {
        const propValue = propNode.value
        const maybeToken = getTokenFromPropValue(ctx, propName, String(propValue))
        if (!maybeToken) return

        const range = nodeRangeToVsCodeRange(getNodeRange(propNode.getNode()))
        return { kind: 'token', token: maybeToken, range, propName, propValue, propNode } as ClosestTokenMatch
      }

      if (box.isMap(propNode) && ctx.conditions.isCondition(propName)) {
        const objectBox = maybeBoxNode(propNode.getNode(), [], boxCtx, () => true)
        if (!objectBox) return

        if (box.isMap(objectBox)) {
          const propValue = unbox(propNode).raw
          const condition = ctx.conditions.getRaw(propName)

          const range = nodeRangeToVsCodeRange(getNodeRange(propNode.getNode()))
          return { kind: 'condition', condition, range, propName, propValue, propNode } as ClosestConditionMatch
        }
      }
    })
  }

  const getClosestInstance = (doc: TextDocument, position: Position) => {
    const ctx = setup.getContext()
    if (!ctx) return

    const match = getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match

    return findClosestInstance(node, stack, ({ name, props }) => {
      const unboxed = unbox(props)
      const { className, css, ...rest } = unboxed.raw
      return { name, props, styles: Object.assign({}, className, css, rest) }
    })
  }

  const getClosestCompletionList = (doc: TextDocument, position: Position) => {
    const ctx = setup.getContext()
    if (!ctx) return

    const match = getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match

    return findClosestToken(node, stack, ({ propName, propNode }) => {
      if (!box.isLiteral(propNode)) return undefined
      return getCompletionFor(ctx, propName, propNode.value)
    })
  }

  return {
    getSourceFile,
    parseSourceFile,
    getFileTokens,
    findClosestToken,
    getClosestToken,
    getClosestInstance,
    getClosestCompletionList,
  }
}

const getDescendantAtPos = (from: Node, pos: number) => {
  let node: Node | undefined = from
  let stack: Node[] = [from]

  while (true) {
    const nextNode: Node | undefined = node.getChildAtPos(pos)
    if (nextNode == null) return { node, stack }
    else {
      node = nextNode
      stack.push(node)
    }
  }
}

const getColorExtensions = (value: string) => {
  const vscodeColor = color2kToVsCodeColor(value)
  if (!vscodeColor) return

  return { vscodeColor, kind: 'native-color' }
}

const getTokenFromPropValue = (ctx: PandaContext, prop: string, value: string): Token | undefined => {
  const utility = ctx.config.utilities?.[prop]

  const category = typeof utility?.values === 'string' && utility?.values
  if (!category) return

  const tokenPath = [category, value].join('.')
  const token = ctx.tokens.getByName(tokenPath)

  // arbitrary value like
  // display: "block", zIndex: 1, ...
  if (!token) {
    // any color
    // color: "blue", color: "#000", color: "rgb(0, 0, 0)", ...
    if (isColor(value)) {
      const extensions = getColorExtensions(value)
      if (!extensions) return

      return { value, name: value, path: tokenPath, type: 'color', extensions } as unknown as Token
    }

    // border="1px solid token(colors.gray.300)"
    if (typeof value === 'string' && value.includes('token(')) {
      const matches = expandTokenFn(value, ctx.tokens.getByName)

      // TODO: handle multiple tokens like : "token(colors.gray.300), token(colors.gray.500)"
      const first = matches?.[0]?.token
      if (!first) return

      if (isColor(first.value)) {
        const extensions = getColorExtensions(first.value)
        if (!extensions) return

        return first.setExtensions(extensions)
      }

      return first
    }

    return
  }

  // known theme token
  // px: "2", fontSize: "xl", ...
  // color: "blue.300"
  if (isColor(token.value)) {
    const extensions = getColorExtensions(token.value)
    if (!extensions) return

    return token.setExtensions(extensions)
  }

  return token
}

const completionCache = new Map<string, CompletionItem[]>()
const itemCache = new Map<string, CompletionItem>()

const getCompletionFor = (ctx: PandaContext, propName: string, propValue: PrimitiveType) => {
  const cachePath = propName + '.' + propValue
  const cachedList = completionCache.get(cachePath)
  if (cachedList) return cachedList

  const utility = ctx.config.utilities?.[propName]
  const category = typeof utility?.values === 'string' && utility?.values
  if (!category) return

  const values = ctx.tokens.categoryMap.get(category)
  if (!values) return

  const items = [] as CompletionItem[]
  values.forEach((token, name) => {
    if (!name.includes(String(propValue))) return

    const tokenPath = token.name
    const cachedItem = itemCache.get(tokenPath)
    if (cachedItem) {
      items.push(cachedItem)
      return
    }

    const isColor = token.extensions.category === 'colors'
    const completionItem = {
      label: name,
      kind: isColor ? CompletionItemKind.Color : CompletionItemKind.EnumMember,
      documentation: { kind: 'markdown', value: getMarkdownCss(ctx, { [propName]: token.value }).withCss },
      labelDetails: { description: printTokenValue(token) },
      sortText: '-' + name,
      preselect: true,
    } as CompletionItem

    if (isColor) {
      completionItem.detail = token.value
      // TODO rgb conversion ?
    }

    items.push(completionItem)
    itemCache.set(tokenPath, completionItem)
  })

  completionCache.set(cachePath, items)
  return items
}

// quick index based loop
const getFirstAncestorMatching = <Ancestor extends Node>(
  stack: Node[],
  callback: (parent: Node, index: number) => parent is Ancestor,
) => {
  for (let i = stack.length - 1; i >= 0; i--) {
    const parent = stack[i]
    if (callback(parent, i)) return parent
  }
}
