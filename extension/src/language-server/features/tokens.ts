import { ColorPresentationParams, CompletionItem, CompletionItemKind, Position, Range } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { PandaExtensionSetup } from '../config'

import { Dict, ParserResult, ResultItem, SystemStyleObject } from '@pandacss/types'
import { CallExpression, JsxOpeningElement, JsxSelfClosingElement, Node, ts } from 'ts-morph'

import { AtomicRule, Stylesheet } from '@pandacss/core'
import {
  BoxContext,
  BoxNode,
  BoxNodeLiteral,
  BoxNodeMap,
  BoxNodeObject,
  PrimitiveType,
  box,
  extractCallExpressionArguments,
  extractJsxAttribute,
  extractJsxSpreadAttributeValues,
  maybeBoxNode,
  unbox,
} from '@pandacss/extractor'
import { type PandaContext } from '@pandacss/node'
import { mapObject, toPx, walkObject } from '@pandacss/shared'
import { parseToRgba } from 'color2k'
import postcss from 'postcss'
import { match } from 'ts-pattern'
import { isColor } from '../utils/isColor'
import { Bool } from 'lil-fp'

type Token = NonNullable<ReturnType<PandaContext['tokens']['getByName']>>
type ClosestToken = { token: Token; range: Range; propName: string; propValue: PrimitiveType; propNode: BoxNodeLiteral }
type ClosestInstance = { tokenList: Token[]; range: Range; name: string; props: BoxNodeMap | BoxNodeObject }

type OnTokenCallback = (args: ClosestToken) => void

const canEvalFn = (name: string) => name === 'css' || name === 'cx'
const mergeCx = (...args: any[]) =>
  args.filter(Boolean).reduce((acc, curr) => {
    // console.log({ acc, curr })
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

const ref = {
  stylesheet: undefined as Stylesheet | undefined,
}
const helpers = { map: mapObject }
const isNodeJsx = Bool.or(Node.isJsxSelfClosingElement, Node.isJsxOpeningElement)
const isObjectLike = Bool.or(box.isObject, box.isMap)

export function setupTokensHelpers(setup: PandaExtensionSetup) {
  const versionByFilepath = new Map<string, number>()

  const getStylesheet = () => {
    if (ref.stylesheet) return ref.stylesheet

    const ctx = setup.getContext()
    if (!ctx) return

    ref.stylesheet = ctx.createSheet()
    return ref.stylesheet
  }

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

        // const styleObject = normalizeStyleObject(styles, ctx)
        // console.log({ styleObject })

        walkObject(styles, (value, paths) => {
          // if value doesn't exist
          if (value == null) return

          const [prop, ..._allConditions] = ctx.conditions.shift(paths)
          const propNode = boxNode.value.get(prop)
          if (!box.isLiteral(propNode)) return

          const propName = ctx.utility.resolveShorthand(prop)
          const token = getTokenFromPropValue(ctx, propName, value)
          if (!token) return

          // console.log({ prop, value, paths, propNode })
          const range = nodeRangeToVsCodeRange(getNodeRange(propNode.getNode()))
          onToken?.({ token, range, propName, propValue: value, propNode })
        })
      })
    }
  }

  const getColorExtensions = (value: string) => {
    const vscodeColor = color2kToVsCodeColor(value)
    if (!vscodeColor) return

    return { vscodeColor, kind: 'native-color' }
  }

  const getTokenFromPropValue = (ctx: PandaContext, prop: string, value: any): Token | undefined => {
    const utility = ctx.config.utilities?.[prop]

    const category = typeof utility?.values === 'string' && utility?.values
    if (!category) return

    // console.log({ utility, category, prop, value })

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

        // TODO: handle multiple tokens
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
    onFoundToken: (args: Pick<ClosestInstance, 'name' | 'props'>) => Return,
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

            return onFoundToken({ name, props: styles })
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

            return onFoundToken({ name, props: box.object(styles, callExpression, stack) })
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

          return onFoundToken({ name, props: box.map(props, componentNode, stack) })
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
    onFoundToken: (args: Pick<ClosestToken, 'propName' | 'propValue' | 'propNode'>) => Return,
  ) => {
    const ctx = setup.getContext()
    if (!ctx) return

    return match(node)
      .when(
        () => getFirstAncestorMatching(stack, Node.isPropertyAssignment),
        () => {
          const propAssignment = getFirstAncestorMatching(stack, Node.isPropertyAssignment)!
          const name = propAssignment.getName()
          // console.log({ propAssignmnt: name })

          const objectLiteral = getFirstAncestorMatching(stack, Node.isObjectLiteralExpression)!
          const maybeBox = maybeBoxNode(objectLiteral, [], boxCtx, (args) => args.propName === name)
          if (!box.isMap(maybeBox)) return

          const propNode = maybeBox.value.get(name)
          if (!box.isLiteral(propNode)) return

          const propName = ctx.utility.resolveShorthand(name)
          const propValue = propNode.value

          return onFoundToken({ propName, propValue, propNode })
        },
      )
      .when(
        () => getFirstAncestorMatching(stack, Node.isJsxAttribute),
        () => {
          const attrNode = getFirstAncestorMatching(stack, Node.isJsxAttribute)!

          const nameNode = attrNode.getNameNode()
          const name = nameNode.getText()
          // console.log({ attrNode: name })

          const maybeBox = extractJsxAttribute(attrNode, boxCtx)
          if (!box.isLiteral(maybeBox)) return

          const propName = ctx.utility.resolveShorthand(name)
          const propValue = maybeBox.value
          // console.log({ propName, propValue })

          return onFoundToken({ propName, propValue, propNode: maybeBox })
        },
      )
      .otherwise(() => {
        //
        return undefined
      })
  }

  const getTokenAtNode = (node: Node, stack: Node[]): ClosestToken | undefined => {
    const ctx = setup.getContext()
    if (!ctx) return

    return findClosestToken(node, stack, ({ propName, propValue, propNode }) => {
      const maybeToken = getTokenFromPropValue(ctx, propName, propValue)
      if (!maybeToken) return

      // console.log(maybeToken)
      const range = nodeRangeToVsCodeRange(getNodeRange(propNode.getNode()))
      return { token: maybeToken, range, propName, propValue, propNode } as ClosestToken
    })
  }

  const getClosestToken = (doc: TextDocument, position: Position): ClosestToken | undefined => {
    const match = getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match
    // console.log({
    //   line: position.line,
    //   column: position.character,
    //   text: node.getText(),
    //   stack: stack.map((node) => node.getKindName()),
    // })

    return getTokenAtNode(node, stack)
  }

  const getClosestInstance = (doc: TextDocument, position: Position) => {
    const ctx = setup.getContext()
    if (!ctx) return

    const match = getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match
    // console.log({
    //   line: position.line,
    //   column: position.character,
    //   text: node.getText(),
    //   stack: stack.map((node) => node.getKindName()),
    // })

    return findClosestInstance(node, stack, ({ name, props }) => {
      const unboxed = unbox(props)
      const { className, css, ...rest } = unboxed.raw
      return { name, props, styles: Object.assign({}, className, css, rest) }
    })
  }

  const makeSheetCtx = (ctx: PandaContext) => ({
    root: postcss.root(),
    conditions: ctx.conditions,
    utility: ctx.utility,
    hash: ctx.config.hash,
    helpers,
  })

  const getMarkdownCss = (ctx: PandaContext, styles: SystemStyleObject) => {
    const rule = new AtomicRule(makeSheetCtx(ctx))
    rule.process({ styles })

    const css = rule.toCss()
    const withCss = '```css' + '\n' + css + '\n' + '```'

    return { css, withCss }
  }

  const printTokenValue = (token: Token) =>
    `🐼 ${token.value}${token.value.includes('rem') ? ` (${toPx(token.value)})` : ''}`

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

      const tokenPath = name + '.' + token.value
      const cachedItem = itemCache.get(tokenPath)
      if (cachedItem) {
        items.push(cachedItem)
        return
      }

      const isColor = token.extensions.category === 'colors'
      const completionItem = {
        label: name,
        kind: isColor ? CompletionItemKind.Color : CompletionItemKind.EnumMember,
        documentation: { kind: 'markdown', value: getMarkdownCss(ctx, { [name]: token.value }).withCss },
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

  const getClosestCompletionList = (doc: TextDocument, position: Position) => {
    const ctx = setup.getContext()
    if (!ctx) return

    const sheet = getStylesheet()
    if (!sheet) return

    const match = getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match
    // console.log({
    //   line: position.line,
    //   column: position.character,
    //   text: node.getText(),
    //   stack: stack.map((node) => node.getKindName()),
    // })

    return findClosestToken(node, stack, ({ propName, propValue }) => {
      return getCompletionFor(ctx, propName, propValue)
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
    getMarkdownCss,
    getNodeRange,
    printTokenValue,
  }
}

const getNodeRange = (node: Node) => {
  const src = node.getSourceFile()
  const [startPosition, endPosition] = [node.getStart(), node.getEnd()]

  const startInfo = src.getLineAndColumnAtPos(startPosition)
  const endInfo = src.getLineAndColumnAtPos(endPosition)

  return {
    startPosition,
    startLineNumber: startInfo.line,
    startColumn: startInfo.column,
    endPosition,
    endLineNumber: endInfo.line,
    endColumn: endInfo.column,
  }
}

const nodeRangeToVsCodeRange = (range: ReturnType<typeof getNodeRange>) =>
  Range.create(
    { line: range.startLineNumber - 1, character: range.startColumn - 1 },
    { line: range.endLineNumber - 1, character: range.endColumn - 1 },
  )

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

const color2kToVsCodeColor = (value: string) => {
  try {
    const [red, green, blue, alpha] = parseToRgba(value)

    const color = {
      red: red / 255,
      green: green / 255,
      blue: blue / 255,
      alpha,
    }
    return color as ColorPresentationParams['color']
  } catch (e) {
    return
  }
}

const tokenRegex = /token\(([^)]+)\)/g

/** @see packages/core/src/plugins/expand-token-fn.ts */
const expandTokenFn = (str: string, fn: (tokenName: string) => Token | undefined) => {
  if (!str.includes('token(')) return []

  const tokens = [] as TokenFnMatch[]
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(str)) != null) {
    match[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => {
        const token = fn(s)
        if (token) {
          tokens.push({ token, index: match!.index })
        }
      })
  }

  return tokens
}

type TokenFnMatch = { token: Token; index: number }

const extractJsxElementProps = (node: JsxOpeningElement | JsxSelfClosingElement, ctx: BoxContext) => {
  const tagName = node.getTagNameNode().getText()
  const jsxAttributes = node.getAttributes()

  const props = new Map<string, BoxNode>()
  jsxAttributes.forEach((attrNode) => {
    if (Node.isJsxAttribute(attrNode)) {
      const nameNode = attrNode.getNameNode()
      const maybeValue = extractJsxAttribute(attrNode, ctx)
      if (!maybeValue) return

      props.set(nameNode.getText(), maybeValue)
      return
    }

    if (Node.isJsxSpreadAttribute(attrNode)) {
      const maybeValue = extractJsxSpreadAttributeValues(attrNode, ctx, () => true)
      if (!isObjectLike(maybeValue)) return

      if (box.isMap(maybeValue)) {
        maybeValue.value.forEach((value, propName) => {
          props.set(propName, value)
        })
      }

      if (box.isObject(maybeValue)) {
        Object.entries(maybeValue.value).forEach(([propName, value]) => {
          props.set(propName, box.literal(value as any, node, []))
        })
      }
    }
  })

  return { name: tagName, props }
}

const fromObjectLike = (objLikeNode: BoxNodeMap | BoxNodeObject) => {
  if (box.isMap(objLikeNode)) {
    let obj = {} as Dict
    objLikeNode.value.forEach((node, key) => (obj[key] = node))
    return obj
  }

  return objLikeNode.value as Dict
}
