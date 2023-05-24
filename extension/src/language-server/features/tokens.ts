import { ColorPresentationParams, Position, Range } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { PandaExtensionSetup } from '../config'

import { ParserResult, ResultItem, Token as TokenDefinition } from '@pandacss/types'
import { Node, ts } from 'ts-morph'

import { BoxContext, BoxNode, PrimitiveType, box, extractJsxAttribute, maybeBoxNode } from '@pandacss/extractor'
import { PandaContext } from '@pandacss/node'
import { normalizeStyleObject, walkObject } from '@pandacss/shared'
import { match } from 'ts-pattern'
import { isColor } from '../utils/isColor'
import { parseToRgba } from 'color2k'

type Token = NonNullable<ReturnType<PandaContext['tokens']['getByName']>>
type ClosestToken = { token: Token; range: Range; propName: string; propValue: PrimitiveType; box: BoxNode }
type OnTokenCallback = (args: ClosestToken) => void
const boxCtx: BoxContext = { flags: { skipTraverseFiles: true, skipEvaluate: true } }

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

        // const styleObject = normalizeStyleObject(styles, ctx)
        // console.log({ styleObject })

        walkObject(styles, (value, paths) => {
          // if value doesn't exist
          if (value == null) return

          const [prop, ..._allConditions] = ctx.conditions.shift(paths)
          const propNode = boxNode.value.get(prop)
          if (!propNode) return

          const propName = ctx.utility.resolveShorthand(prop)
          const token = getTokenFromPropValue(ctx, propName, value)
          if (!token) return

          // console.log({ prop, value, paths, propNode })
          const range = nodeRangeToVsCodeRange(getNodeRange(propNode.getNode()))
          onToken?.({ token, range, propName, propValue: value, box: propNode })
        })
      })
    }
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
        const vscodeColor = color2kToVsCodeColor(value)
        if (!vscodeColor) return

        return { value, name: value, path: tokenPath, type: 'color', extensions: { vscodeColor } } as unknown as Token
      }

      // border="1px solid token(colors.gray.300)"
      if (typeof value === 'string' && value.includes('token(')) {
        const matches = expandTokenFn(value, ctx.tokens.getByName)

        // TODO: handle multiple tokens
        const first = matches?.[0]?.token
        if (!first) return

        if (isColor(first.value)) {
          const vscodeColor = color2kToVsCodeColor(first.value)
          if (!vscodeColor) return

          return first.setExtensions({ vscodeColor: color2kToVsCodeColor(first.value) })
        }

        return first
      }

      return
    }

    // known theme token
    // px: "2", fontSize: "xl", ...
    // color: "blue.300"
    if (isColor(token.value)) {
      const vscodeColor = color2kToVsCodeColor(token.value)
      if (!vscodeColor) return

      return token.setExtensions({ vscodeColor: color2kToVsCodeColor(token.value) })
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

  const getClosestToken = (doc: TextDocument, position: Position): ClosestToken | undefined => {
    const ctx = setup.getContext()
    if (!ctx) return

    const sourceFile = getSourceFile(doc)
    if (!sourceFile) return

    const charIndex = ts.getPositionOfLineAndCharacter(sourceFile.compilerNode, position.line, position.character)
    const { node, stack } = getDescendantAtPos(sourceFile, charIndex)
    if (!node) return

    // console.log({
    //   line: position.line,
    //   column: position.character,
    //   character: charIndex,
    //   text: node.getText(),
    //   stack: stack.map((node) => node.getKindName()),
    // })

    return getTokenAtNode(node, stack)
  }

  const getTokenAtNode = (node: Node, stack: Node[]): ClosestToken | undefined => {
    const ctx = setup.getContext()
    if (!ctx) return

    // quick index based loop
    const getFirstAncestorMatching = <Ancestor extends Node>(
      callback: (parent: Node, index: number) => parent is Ancestor,
    ) => {
      for (let i = stack.length - 1; i >= 0; i--) {
        const parent = stack[i]
        if (callback(parent, i)) return parent
      }
    }

    return match(node)
      .when(
        () => getFirstAncestorMatching(Node.isPropertyAssignment),
        () => {
          const propAssignment = getFirstAncestorMatching(Node.isPropertyAssignment)!
          const name = propAssignment.getName()

          const objectLiteral = getFirstAncestorMatching(Node.isObjectLiteralExpression)!
          const maybeBox = maybeBoxNode(objectLiteral, [], boxCtx, (args) => args.propName === name)
          if (!box.isMap(maybeBox)) return

          const propNode = maybeBox.value.get(name)
          if (!box.isLiteral(propNode)) return

          const propName = ctx.utility.resolveShorthand(name)
          const propValue = propNode.value

          const maybeToken = getTokenFromPropValue(ctx, propName, propValue)
          if (!maybeToken) return

          // console.log(maybeToken)

          const range = nodeRangeToVsCodeRange(getNodeRange(propNode.getNode()))
          return { token: maybeToken, range, propName, propValue, box: propNode }
        },
      )
      .when(
        () => getFirstAncestorMatching(Node.isJsxAttribute),
        () => {
          const attrNode = getFirstAncestorMatching(Node.isJsxAttribute)!

          const nameNode = attrNode.getNameNode()
          const maybeBox = extractJsxAttribute(attrNode, boxCtx)
          if (!box.isLiteral(maybeBox)) return

          const name = nameNode.getText()
          const propName = ctx.utility.resolveShorthand(name)
          const propValue = maybeBox.value
          // console.log({ propName, propValue })

          const maybeToken = getTokenFromPropValue(ctx, propName, propValue)
          if (!maybeToken) return

          // console.log(maybeToken)

          const range = nodeRangeToVsCodeRange(getNodeRange(attrNode))
          return { token: maybeToken, range, propName, propValue, box: maybeBox }
        },
      )
      .otherwise(() => {
        //
        return undefined
      })
  }

  return {
    getSourceFile,
    parseSourceFile,
    getFileTokens,
    getClosestToken,
    getNodeRange,
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
