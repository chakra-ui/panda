import { CompletionItem, CompletionItemKind, Position, Range } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { type PandaExtensionSetup } from '../setup-builder'

import {
  type Dict,
  type ParserResultType,
  type RawCondition,
  type ResultItem,
  type SystemStyleObject,
} from '@pandacss/types'
import { CallExpression, Identifier, JsxOpeningElement, JsxSelfClosingElement, Node, ts } from 'ts-morph'

import {
  BoxNodeArray,
  BoxNodeLiteral,
  BoxNodeMap,
  BoxNodeObject,
  box,
  extractCallExpressionArguments,
  extractJsxAttribute,
  extractJsxElementProps,
  findIdentifierValueDeclaration,
  maybeBoxNode,
  unbox,
  type BoxContext,
  type PrimitiveType,
  type Unboxed,
} from '@pandacss/extractor'
import { type PandaContext } from '@pandacss/node'
import { walkObject } from '@pandacss/shared'
import { type Token } from '@pandacss/token-dictionary'
import { Bool } from 'lil-fp'
import { type PandaVSCodeSettings } from 'panda-css-extension-shared'
import { match } from 'ts-pattern'
import { color2kToVsCodeColor } from './color2k-to-vscode-color'
import { expandTokenFn, extractTokenPaths } from './expand-token-fn'
import { isColor } from './is-color'
import { getMarkdownCss, isObjectLike, nodeRangeToVsCodeRange, printTokenValue } from './utils'

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

type ClosestInstanceMatch = { name: string }
type ClosestStylesInstance = { kind: 'styles'; props: BoxNodeMap | BoxNodeObject }
type ClosestInstance = ClosestInstanceMatch & ClosestStylesInstance

type OnTokenCallback = (args: ClosestToken) => void
type BoxNodeWithValue = BoxNodeObject | BoxNodeLiteral | BoxNodeMap | BoxNodeArray

const extractableFns = ['css', 'cx'] as const
type ExtractableFnName = (typeof extractableFns)[number]
const canEvalFn = (name: string): name is ExtractableFnName => extractableFns.includes(name as any)

const mergeCx = (...args: any[]) =>
  args.filter(Boolean).reduce((acc, curr) => {
    if (typeof curr === 'object') return Object.assign(acc, curr)

    return acc
  }, {})

const isFunctionMadeFromDefineParts = (expr: Identifier) => {
  const declaration = findIdentifierValueDeclaration(expr, [], boxCtx)
  if (!Node.isVariableDeclaration(declaration)) return

  const initializer = declaration.getInitializer()
  if (!Node.isCallExpression(initializer)) return

  const fromFunctionName = initializer.getExpression().getText()
  return fromFunctionName === 'defineParts'
}

const boxCtx: BoxContext = {
  flags: { skipTraverseFiles: true },
  getEvaluateOptions: (node) => {
    if (!Node.isCallExpression(node)) return
    const expr = node.getExpression()

    if (!Node.isIdentifier(expr)) return
    const name = expr.getText()

    // TODO - check for import alias ? kinda overkill for now
    if (!canEvalFn(name as string) && !isFunctionMadeFromDefineParts(expr)) {
      return
    }

    return {
      environment: {
        extra: {
          cx: mergeCx,
          css: (styles: SystemStyleObject) => styles,
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

export function setupTokensHelpers(setup: PandaExtensionSetup): any {
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

    project.addSourceFile(doc.uri, doc.getText())
    return project.parseSourceFile(doc.uri)
  }

  const createResultTokensGetter = (onToken: OnTokenCallback) => {
    const ctx = setup.getContext()
    if (!ctx)
      return () => {
        //
      }

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

          const range = nodeRangeToVsCodeRange(propNode.getRange())
          onToken?.({ kind: 'token', token, range, propName, propValue: value, propNode })
        })
      })
    }
  }

  /**
   * Get all the tokens from the document and call a callback on it.
   */
  function getFileTokens(_doc: TextDocument, parserResult: ParserResultType, onToken: OnTokenCallback) {
    const ctx = setup.getContext()
    if (!ctx) return

    const onResult = createResultTokensGetter(onToken)

    parserResult.css.forEach(onResult)
    parserResult.jsx.forEach(onResult)
    parserResult.cva.forEach((item) =>
      item.data.forEach(({ base }) =>
        onResult(Object.assign({}, item, { box: item.box.value.get('base'), data: [base] })),
      ),
    )
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
    onFoundInstance: (args: ClosestInstance) => Return,
  ) => {
    const ctx = setup.getContext()
    if (!ctx) return

    let current: Node | undefined = node

    return match(node)
      .when(
        () => {
          const callExpression = getFirstAncestorMatching(stack, (node): node is CallExpression => {
            if (!Node.isCallExpression(node)) return false
            const expr = node.getExpression()

            // TODO - check for import alias ? kinda overkill for now
            if (Node.isIdentifier(expr) && !canEvalFn(expr.getText())) return false

            return true
          })
          if (!callExpression) return

          current = callExpression
          return current
        },
        () => {
          const callExpression = current as CallExpression
          const name = callExpression.getExpression().getText() as ExtractableFnName

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

            return onFoundInstance({
              kind: 'styles',
              name,
              props: box.object(styles, callExpression, stack),
            })
          }

          const list = extractCallExpressionArguments(
            callExpression,
            boxCtx,
            () => true,
            (args) => args.index === 0,
          )
          const config = list.value[0]
          if (!isObjectLike(config)) return

          if (name === 'css' || name === 'defineStyles') {
            return onFoundInstance({ kind: 'styles', name, props: config })
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

          return onFoundInstance({ kind: 'styles', name, props: box.map(props, componentNode, stack) })
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

        const range = nodeRangeToVsCodeRange(propNode.getRange())
        return { kind: 'token', token: maybeToken, range, propName, propValue, propNode } as ClosestTokenMatch
      }

      if (box.isMap(propNode) && ctx.conditions.isCondition(propName)) {
        const objectBox = maybeBoxNode(propNode.getNode(), [], boxCtx, () => true)
        if (!objectBox) return

        if (box.isMap(objectBox)) {
          const propValue = unbox(propNode).raw
          const condition = ctx.conditions.getRaw(propName)

          const range = nodeRangeToVsCodeRange(propNode.getRange())
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

    return findClosestInstance(node, stack, (instance) => {
      if (instance.kind === 'styles') {
        const { name, props } = instance

        const unboxed = unbox(props)
        const { className, css, ...rest } = unboxed.raw
        return {
          kind: 'styles',
          name,
          props,
          styles: Object.assign({}, className, css, rest),
        } as ClosestStylesInstance & { styles: Dict }
      }
    })
  }

  const getClosestCompletionList = async (doc: TextDocument, position: Position) => {
    const ctx = setup.getContext()
    if (!ctx) return

    const match = getNodeAtPosition(doc, position)
    if (!match) return

    const settings = await setup.getPandaSettings()
    const { node, stack } = match

    return findClosestToken(node, stack, ({ propName, propNode }) => {
      if (!box.isLiteral(propNode)) return undefined
      return getCompletionFor(ctx, propName, propNode, settings)
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
  const stack: Node[] = [from]

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nextNode: Node | undefined = node.getChildAtPos(pos)
    if (nextNode == null) return { node, stack }
    else {
      node = nextNode
      stack.push(node)
    }
  }
}

const getColorExtensions = (value: string, kind: string) => {
  const vscodeColor = color2kToVsCodeColor(value)
  if (!vscodeColor) return

  return { vscodeColor, kind }
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
      const extensions = getColorExtensions(value, 'native-color')
      if (!extensions) return

      return { value, name: value, path: tokenPath, type: 'color', extensions } as unknown as Token
    }

    // border="1px solid token(colors.gray.300)"
    if (typeof value === 'string' && value.includes('token(')) {
      const matches = expandTokenFn(value, ctx.tokens.getByName)

      // wrong token path
      if (!matches.length) {
        return {
          value,
          name: value,
          path: tokenPath,
          type: 'color',
          extensions: { kind: 'invalid-token-path' },
        } as unknown as Token
      }

      // TODO: handle multiple tokens like : "token(colors.gray.300), token(colors.gray.500)"
      const first = matches?.[0]?.token
      if (!first) return

      if (isColor(first.value)) {
        const extensions = getColorExtensions(first.value, 'semantic-color')
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
    const extensions = getColorExtensions(token.value, 'color')
    if (!extensions) return

    return token.setExtensions(extensions)
  }

  return token
}

const completionCache = new Map<string, CompletionItem[]>()
const itemCache = new Map<string, CompletionItem>()

const getCompletionFor = (
  ctx: PandaContext,
  propName: string,
  propNode: BoxNodeLiteral,
  settings: PandaVSCodeSettings,
) => {
  const propValue = propNode.value

  let str = String(propValue)

  // also provide completion in string such as: token('colors.blue.300')
  if (settings['completions.token-fn.enabled'] && str.includes('token(')) {
    const matches = extractTokenPaths(str)
    const tokenPath = matches[0] ?? ''
    const split = tokenPath.split('.')

    // provide completion for token category when token() is empty or partial
    if (split.length <= 1) {
      return Array.from(ctx.tokens.categoryMap.keys()).map((category) => {
        return {
          label: category,
          kind: CompletionItemKind.EnumMember,
          sortText: '-' + category,
          preselect: true,
        } as CompletionItem
      })
    }

    str = tokenPath.split('.').slice(1).join('.')
  }

  const cachePath = propName + '.' + str
  const cachedList = completionCache.get(cachePath)
  if (cachedList) return cachedList

  const utility = ctx.config.utilities?.[propName]
  const category = typeof utility?.values === 'string' && utility?.values
  if (!category) return []

  const values = ctx.tokens.categoryMap.get(category)
  if (!values) return []

  const items = [] as CompletionItem[]
  values.forEach((token, name) => {
    if (!name.includes(str)) return

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
      documentation: { kind: 'markdown', value: getMarkdownCss(ctx, { [propName]: token.value }, settings).withCss },
      labelDetails: { description: printTokenValue(token, settings), detail: `   ${token.extensions.varRef}` },
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
