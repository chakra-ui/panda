import type {
  ArrayLiteralExpression,
  BinaryExpression,
  BindingElement,
  ElementAccessExpression,
  ExportDeclaration,
  Expression,
  Identifier,
  ImportDeclaration,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  PropertyAccessExpression,
  PropertySignature,
  SourceFile,
  SyntaxKind,
  TemplateExpression,
  TypeLiteralNode,
  TypeNode,
  VariableDeclaration,
} from 'ts-morph'
import { Node, ts } from 'ts-morph'
import { box } from './box'
import { safeEvaluateNode } from './evaluate-node'
import { findIdentifierValueDeclaration } from './find-identifier-value-declaration'
import { isBoxNode, type BoxNode } from './box-factory'
import type { BoxContext, EvaluatedObjectResult, LiteralValue, MatchFnPropArgs, PrimitiveType } from './types'
import { isNotNullish, isObject, trimWhitespace, unwrapExpression } from './utils'
import { getObjectLiteralExpressionPropPairs } from './get-object-literal-expression-prop-pairs'

const cacheMap = new WeakMap<Node, MaybeBoxNodeReturn>()
const isCached = (node: Node) => cacheMap.has(node)
const getCached = (node: Node) => cacheMap.get(node)

const isPlusSyntax = (op: SyntaxKind) => op === ts.SyntaxKind.PlusToken
const isLogicalSyntax = (op: SyntaxKind) =>
  op === ts.SyntaxKind.BarBarToken ||
  op === ts.SyntaxKind.QuestionQuestionToken ||
  op === ts.SyntaxKind.AmpersandAmpersandToken ||
  op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
  op === ts.SyntaxKind.EqualsEqualsToken ||
  op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
  op === ts.SyntaxKind.ExclamationEqualsToken ||
  op === ts.SyntaxKind.GreaterThanEqualsToken ||
  op === ts.SyntaxKind.GreaterThanToken ||
  op === ts.SyntaxKind.LessThanEqualsToken ||
  op === ts.SyntaxKind.LessThanToken ||
  op === ts.SyntaxKind.InstanceOfKeyword ||
  op === ts.SyntaxKind.InKeyword

const isOperationSyntax = (op: SyntaxKind) =>
  op === ts.SyntaxKind.AsteriskToken ||
  op === ts.SyntaxKind.SlashToken ||
  op === ts.SyntaxKind.PercentToken ||
  op === ts.SyntaxKind.AsteriskAsteriskToken ||
  op === ts.SyntaxKind.MinusToken

const canReturnWhenTrueInLogicalExpression = (op: ts.SyntaxKind) => {
  return op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken
}

export type MaybeBoxNodeReturn = BoxNode | undefined

export function maybeBoxNode(
  node: Node,
  stack: Node[],
  ctx: BoxContext,
  matchProp?: (prop: MatchFnPropArgs) => boolean,
): MaybeBoxNodeReturn {
  const cache = (value: MaybeBoxNodeReturn) => {
    cacheMap.set(node, value)
    return value
  }

  if (isCached(node)) {
    return getCached(node)
  }

  // <Box color="xxx" /> or <Box color={`xxx`} />
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    const value = trimWhitespace(node.getLiteralValue())
    return cache(box.literal(value, node, stack))
  }

  if (Node.isObjectLiteralExpression(node)) {
    return cache(getObjectLiteralExpressionPropPairs(node, stack, ctx, matchProp))
  }

  // <Box truncate={true} /> or <Box truncate={false} />
  if (Node.isTrueLiteral(node) || Node.isFalseLiteral(node)) {
    const value = node.getLiteralValue()
    return cache(box.literal(value, node, stack))
  }

  // <Box color={123} />
  if (Node.isNumericLiteral(node)) {
    const value = node.getLiteralValue()
    return cache(box.literal(value, node, stack))
  }

  // <Box color={null} />
  if (Node.isNullLiteral(node)) {
    return cache(box.literal(null, node, stack))
  }

  // <Box mt={-12} />
  if (Node.isPrefixUnaryExpression(node)) {
    const operand = node.getOperand()
    const operator = node.getOperatorToken()
    const boxNode = maybeBoxNode(operand, stack, ctx)
    if (!box.isNumberLiteral(boxNode)) return
    return cache(operator === ts.SyntaxKind.MinusToken ? box.literal(-Number(boxNode.value), node, stack) : boxNode)
  }

  // <ColorBox color={['red.300', 'green.400']} />
  if (Node.isArrayLiteralExpression(node)) {
    const boxNodes = node.getElements().map((element) => {
      return maybeBoxNode(element, stack, ctx) ?? cache(box.unresolvable(element, stack))
    }) as BoxNode[]

    return cache(box.array(boxNodes, node, stack))
  }

  // <ColorBox color={staticColor} />
  if (Node.isIdentifier(node)) {
    const value = node.getText()
    if (value === 'undefined') return cache(box.literal(undefined, node, stack))
    return cache(maybeIdentifierValue(node, stack, ctx))
  }

  // <ColorBox color={css`red.400`} />
  if (Node.isTemplateHead(node)) {
    return cache(box.literal(node.getLiteralText(), node, stack))
  }

  // <ColorBox color={`${color}.400`} />
  if (Node.isTemplateExpression(node)) {
    const value = maybeTemplateStringValue(node, stack, ctx)
    return cache(box.literal(value, node, stack))
  }

  // css`font-size: 1.5em;`
  if (Node.isTaggedTemplateExpression(node)) {
    return cache(maybeBoxNode(node.getTemplate(), stack, ctx))
  }

  // <ColorBox color={colors[staticColor]} /> or <ColorBox color={colors["brand"]} />
  if (Node.isElementAccessExpression(node)) {
    return cache(getElementAccessedExpressionValue(node, stack, ctx))
  }

  // <ColorBox color={colors.brand} />
  if (Node.isPropertyAccessExpression(node)) {
    return cache(getPropertyAccessedExpressionValue(node, [], stack, ctx)!)
  }

  // <ColorBox color={useColorModeValue() ? darkValue : "whiteAlpha.100"} />
  if (Node.isConditionalExpression(node)) {
    if (ctx.flags?.skipConditions) {
      return cache(box.unresolvable(node, stack))
    }

    const condExpr = unwrapExpression(node.getCondition())

    const condBoxNode =
      (Node.isIdentifier(condExpr)
        ? maybeBoxNode(condExpr, [], ctx)
        : safeEvaluateNode<LiteralValue>(condExpr as Expression, stack, ctx)) ?? box.unresolvable(condExpr, stack)

    const condValue = isBoxNode(condBoxNode) ? condBoxNode : box.from(condBoxNode, node, stack)
    if (box.isEmptyInitializer(condValue)) return

    const isFromDefaultBinding = condValue.getStack().some((node) => Node.isBindingElement(node))
    if (box.isUnresolvable(condValue) || box.isConditional(condValue) || isFromDefaultBinding) {
      const whenTrueExpr = unwrapExpression(node.getWhenTrue())
      const whenFalseExpr = unwrapExpression(node.getWhenFalse())
      return cache(maybeResolveConditionalExpression({ whenTrueExpr, whenFalseExpr, node, stack }, ctx))
    }

    if (condValue.value) {
      const whenTrueExpr = unwrapExpression(node.getWhenTrue())
      const innerStack = [...stack] as Node[]
      const maybeValue = maybeBoxNode(whenTrueExpr, innerStack, ctx)
      return cache(maybeValue ?? box.unresolvable(whenTrueExpr, stack))
    }

    const whenFalseExpr = unwrapExpression(node.getWhenFalse())
    const innerStack = [...stack] as Node[]

    const maybeValue = maybeBoxNode(whenFalseExpr, innerStack, ctx)

    return cache(maybeValue ?? box.unresolvable(node, stack))
  }

  // <ColorBox color={fn()} />
  if (Node.isCallExpression(node)) {
    const value = safeEvaluateNode<PrimitiveType | EvaluatedObjectResult>(node, stack, ctx)
    if (!value) return
    return cache(box.from(value, node, stack))
  }

  // <ColorBox color={isFocused && "red.400"} />
  if (Node.isBinaryExpression(node)) {
    const operatorKind = node.getOperatorToken().getKind()

    if (isPlusSyntax(operatorKind)) {
      const value =
        tryComputingPlusTokenBinaryExpressionToString(node, stack, ctx) ?? safeEvaluateNode<string>(node, stack, ctx)
      if (!value) return
      return cache(box.from(value, node, stack))
    }

    if (isLogicalSyntax(operatorKind)) {
      const whenTrueExpr = unwrapExpression(node.getLeft())
      const whenFalseExpr = unwrapExpression(node.getRight())
      const exprObject = {
        whenTrueExpr,
        whenFalseExpr,
        node,
        stack,
        canReturnWhenTrue: canReturnWhenTrueInLogicalExpression(operatorKind),
      } as const
      return cache(maybeResolveConditionalExpression(exprObject, ctx))
    }

    if (isOperationSyntax(operatorKind)) {
      return cache(box.literal(safeEvaluateNode(node, stack, ctx), node, stack))
    }
  }
}

const onlyStringLiteral = (boxNode: MaybeBoxNodeReturn) => {
  if (!boxNode) return

  if (isBoxNode(boxNode) && box.isLiteral(boxNode) && typeof boxNode.value === 'string') {
    return boxNode
  }
}

const onlyNumberLiteral = (boxNode: MaybeBoxNodeReturn) => {
  if (!boxNode) return

  if (isBoxNode(boxNode) && box.isLiteral(boxNode) && typeof boxNode.value === 'number') {
    return boxNode
  }
}

const maybeStringLiteral = (node: Node, stack: Node[], ctx: BoxContext) =>
  onlyStringLiteral(maybeBoxNode(node, stack, ctx))

export const maybePropName = (node: Node, stack: Node[], ctx: BoxContext) => {
  const boxed = maybeBoxNode(node, stack, ctx)
  const strBox = onlyStringLiteral(boxed)
  if (strBox) return strBox

  const numberBox = onlyNumberLiteral(boxed)
  if (numberBox) return numberBox
}

// <ColorBox color={isDark ? darkValue : "whiteAlpha.100"} />
const maybeResolveConditionalExpression = (
  {
    whenTrueExpr,
    whenFalseExpr,
    node,
    stack,
    canReturnWhenTrue,
  }: {
    whenTrueExpr: Node
    whenFalseExpr: Node
    node: Node
    stack: Node[]
    canReturnWhenTrue?: boolean
  },
  ctx: BoxContext,
) => {
  // <ColorBox color={isDark ? { mobile: "blue.100", desktop: "blue.300" } : getColor()} />
  const whenTrueValue = maybeBoxNode(whenTrueExpr, stack, ctx)
  const whenFalseValue = maybeBoxNode(whenFalseExpr, stack, ctx)

  //<ColorBox <ColorBox color={"blue.100" || "never.100"} />
  //<ColorBox <ColorBox color={"blue.100" ?? "never.100"} />
  if (canReturnWhenTrue && whenTrueValue && !box.isUnresolvable(whenTrueValue)) {
    return whenTrueValue
  }

  // <ColorBox <ColorBox color={true && "never.100"} />
  // whenTrueValue === true
  // whenFalseValue === "never.100"
  if (
    Node.isBinaryExpression(node) &&
    node.getOperatorToken().getKind() === ts.SyntaxKind.AmpersandAmpersandToken &&
    whenTrueValue &&
    whenFalseValue &&
    box.isLiteral(whenTrueValue) &&
    whenTrueValue.value === true
  ) {
    return whenFalseValue
  }

  //<ColorBox <ColorBox color={true ? unextractable : unextractable} />
  if (!whenTrueValue && !whenFalseValue) {
    return
  }

  //<ColorBox <ColorBox color={true ? extractableNode : unextractable} />
  if (whenTrueValue && !whenFalseValue) {
    return whenTrueValue
  }

  //<ColorBox <ColorBox color={true ? unextractable : extractableNode} />
  if (!whenTrueValue && whenFalseValue) {
    return whenFalseValue
  }

  const whenTrue = whenTrueValue!
  const whenFalse = whenFalseValue!

  //<ColorBox <ColorBox color={true ? "blue.400" : "blue.400"} />
  if (box.isLiteral(whenTrue) && box.isLiteral(whenFalse) && whenTrue.value === whenFalse.value) {
    return whenTrue
  }

  //<ColorBox <ColorBox color={true ? extractableNode : extractableNode} />
  return box.conditional(whenTrue, whenFalse, node, stack)
}

const findProperty = (node: ObjectLiteralElementLike, propName: string, _stack: Node[], ctx: BoxContext) => {
  const stack = [..._stack]

  if (Node.isPropertyAssignment(node)) {
    const name = node.getNameNode()

    if (Node.isIdentifier(name) && name.getText() === propName) {
      stack.push(name)
      return node
    }

    if (Node.isStringLiteral(name) && name.getLiteralText() === propName) {
      stack.push(name)
      return name.getLiteralText()
    }

    if (Node.isComputedPropertyName(name)) {
      const expression = unwrapExpression(name.getExpression())
      const computedPropNameBox = maybePropName(expression, stack, ctx)
      if (!computedPropNameBox) return

      if (String(computedPropNameBox.value) === propName) {
        stack.push(name, expression)
        return node
      }
    }
  }

  if (Node.isShorthandPropertyAssignment(node)) {
    const name = node.getNameNode()

    if (Node.isIdentifier(name) && name.getText() === propName) {
      stack.push(name)
      return node
    }
  }
}

const getObjectLiteralPropValue = (
  initializer: ObjectLiteralExpression,
  accessList: string[],
  _stack: Node[],
  ctx: BoxContext,
): MaybeBoxNodeReturn => {
  const stack = [..._stack]
  const propName = accessList.pop()!
  const property =
    initializer.getProperty(propName) ?? initializer.getProperties().find((p) => findProperty(p, propName, stack, ctx))

  if (!property) return
  stack.push(property)

  if (Node.isPropertyAssignment(property)) {
    const propInit = property.getInitializer()
    if (!propInit) return

    if (Node.isObjectLiteralExpression(propInit)) {
      if (accessList.length > 0) {
        return getObjectLiteralPropValue(propInit, accessList, stack, ctx)
      }

      return maybeBoxNode(propInit, stack, ctx)
    }

    const maybePropValue = maybeBoxNode(propInit, stack, ctx)
    if (maybePropValue) {
      return maybePropValue
    }
  }

  if (Node.isShorthandPropertyAssignment(property)) {
    const identifier = property.getNameNode()

    if (accessList.length > 0) {
      return maybePropIdentifierValue(identifier, accessList, stack, ctx)
    }

    const maybePropValue = maybeBoxNode(identifier, stack, ctx)
    if (maybePropValue) {
      return maybePropValue
    }
  }
}

const maybeTemplateStringValue = (template: TemplateExpression, stack: Node[], ctx: BoxContext) => {
  const head = template.getHead()
  const tail = template.getTemplateSpans()

  const headValue = maybeStringLiteral(head, stack, ctx)
  if (!headValue) return

  const tailValues = tail.map((t) => {
    const expression = t.getExpression()
    const propBox = maybePropName(expression, stack, ctx)
    if (!propBox) return

    const literal = t.getLiteral()
    return propBox.value + literal.getLiteralText()
  })

  if (tailValues.every(isNotNullish)) {
    return headValue.value + tailValues.join('')
  }
}

const maybeBindingElementValue = (def: BindingElement, stack: Node[], propName: string, ctx: BoxContext) => {
  const parent = def.getParent()

  if (!parent) return

  const grandParent = parent.getParent()
  if (!grandParent) return

  if (Node.isArrayBindingPattern(parent)) {
    const index = parent.getChildIndex()
    if (Number.isNaN(index)) return

    if (Node.isVariableDeclaration(grandParent)) {
      const init = grandParent.getInitializer()
      if (!init) return

      const initializer = unwrapExpression(init)
      if (!Node.isArrayLiteralExpression(initializer)) return

      const element = initializer.getElements()[index + 1]
      if (!element) return

      const innerStack = [...stack, initializer, element]
      const maybeObject = maybeBoxNode(element, innerStack, ctx)
      if (!maybeObject) return

      if (box.isObject(maybeObject)) {
        const propValue = maybeObject.value[propName]

        return box.from(propValue, element, innerStack)
      }

      if (!box.isMap(maybeObject)) {
        return maybeObject
      }

      const propValue = maybeObject.value.get(propName)
      if (!propValue) return

      return propValue
    }
  }

  // TODO
  if (Node.isObjectBindingPattern(parent)) {
    //
  }
}

function maybePropDefinitionValue(def: Node, accessList: string[], _stack: Node[], ctx: BoxContext) {
  const propName = accessList.at(-1)!

  if (Node.isVariableDeclaration(def)) {
    const init = def.getInitializer()

    if (!init) {
      const type = def.getTypeNode()
      if (!type) return

      if (Node.isTypeLiteral(type)) {
        if (accessList.length > 0) {
          const stack = [..._stack]
          stack.push(type)

          let propName = accessList.pop()!
          let typeProp = type.getProperty(propName)
          let typeLiteral = typeProp?.getTypeNode()

          while (typeProp && accessList.length > 0 && typeLiteral && Node.isTypeLiteral(typeLiteral)) {
            stack.push(typeProp, typeLiteral)
            propName = accessList.pop()!
            typeProp = typeLiteral.getProperty(propName)
            typeLiteral = typeProp?.getTypeNode()
          }

          if (!typeLiteral) return

          const typeValue = getTypeNodeValue(typeLiteral, stack, ctx)

          return box.from(typeValue, typeLiteral, stack)
        }

        const propValue = getTypeLiteralNodePropValue(type, propName, _stack, ctx)
        _stack.push(type)
        return box.from(propValue, type, _stack)
      }

      return
    }

    const initializer = unwrapExpression(init)

    if (Node.isObjectLiteralExpression(initializer)) {
      const propValue = getObjectLiteralPropValue(initializer, accessList, _stack, ctx)
      if (!propValue) return

      _stack.push(initializer)
      return propValue
    }

    if (Node.isArrayLiteralExpression(initializer)) {
      const index = Number(propName)
      if (Number.isNaN(index)) return

      const element = initializer.getElements()[index]
      if (!element) return

      _stack.push(initializer)
      const boxed = maybeBoxNode(element, _stack, ctx)
      if (boxed && isBoxNode(boxed) && box.isLiteral(boxed)) {
        return boxed
      }
    }

    const innerStack = [..._stack, initializer]
    const maybeValue = maybeBoxNode(initializer, innerStack, ctx)
    if (maybeValue) return maybeValue
  }

  if (Node.isBindingElement(def)) {
    const value = maybeBindingElementValue(def, _stack, propName, ctx)
    if (value) return value
  }

  if (Node.isEnumDeclaration(def)) {
    const member = def.getMember(propName)
    if (!member) return

    const initializer = member.getInitializer()
    if (!initializer) return

    const innerStack = [..._stack, initializer]
    const maybeValue = maybeBoxNode(initializer, innerStack, ctx)
    if (maybeValue) return maybeValue
  }
}

const maybePropIdentifierValue = (
  identifier: Identifier,
  accessList: string[],
  _stack: Node[],
  ctx: BoxContext,
): BoxNode | undefined => {
  const maybeValueDeclaration = findIdentifierValueDeclaration(identifier, _stack, ctx)

  if (!maybeValueDeclaration) {
    return box.unresolvable(identifier, _stack)
  }

  const maybeValue = maybePropDefinitionValue(maybeValueDeclaration, accessList, _stack, ctx)
  if (maybeValue) return maybeValue

  return box.unresolvable(identifier, _stack)
}

// TODO pass & push in stack ?
const typeLiteralCache = new WeakMap<TypeLiteralNode, null | Map<string, LiteralValue>>()

const getTypeLiteralNodePropValue = (
  type: TypeLiteralNode,
  propName: string,
  stack: Node[],
  ctx: BoxContext,
): LiteralValue => {
  if (typeLiteralCache.has(type)) {
    const map = typeLiteralCache.get(type)

    if (map === null) return
    if (map?.has(propName)) {
      return map.get(propName)
    }
  }

  const members = type.getMembers()
  const prop = members.find((member) => Node.isPropertySignature(member) && member.getName() === propName)

  if (Node.isPropertySignature(prop) && prop.isReadonly()) {
    const propType = prop.getTypeNode()
    if (!propType) {
      typeLiteralCache.set(type, null)

      return
    }

    const propValue = getTypeNodeValue(propType, stack, ctx)
    if (isNotNullish(propValue)) {
      if (!typeLiteralCache.has(type)) {
        typeLiteralCache.set(type, new Map())
      }

      const map = typeLiteralCache.get(type)!
      map.set(propName, propValue)

      return propValue
    }
  }

  typeLiteralCache.set(type, null)
}

export function getNameLiteral(wrapper: Node) {
  if (Node.isStringLiteral(wrapper)) return wrapper.getLiteralText()
  return wrapper.getText()
}

const typeNodeCache = new WeakMap()
const getTypeNodeValue = (type: TypeNode, stack: Node[], ctx: BoxContext): LiteralValue => {
  if (typeNodeCache.has(type)) {
    return typeNodeCache.get(type)
  }

  if (Node.isLiteralTypeNode(type)) {
    const literal = type.getLiteral()
    if (Node.isStringLiteral(literal)) {
      const result = literal.getLiteralText()
      typeNodeCache.set(type, result)

      return result
    }
  }

  if (Node.isTypeLiteral(type)) {
    const members = type.getMembers()
    if (!members.some((member) => !Node.isPropertySignature(member) || !member.isReadonly())) {
      const props = members as PropertySignature[]
      const entries = props
        .map((member) => {
          const nameNode = member.getNameNode()
          const nameText = nameNode.getText()
          const name = getNameLiteral(nameNode)
          if (!name) return

          const value = getTypeLiteralNodePropValue(type, nameText, stack, ctx)
          return [name, value] as const
        })
        .filter(isNotNullish)

      const result = Object.fromEntries(entries)
      typeNodeCache.set(type, result)

      return result
    }
  }

  typeNodeCache.set(type, undefined)
}

const maybeDefinitionValue = (def: Node, stack: Node[], ctx: BoxContext): BoxNode | undefined => {
  if (Node.isShorthandPropertyAssignment(def)) {
    const propNameNode = def.getNameNode()
    return maybePropIdentifierValue(propNameNode, [propNameNode.getText()], stack, ctx)
  }

  // const staticColor =
  if (Node.isVariableDeclaration(def)) {
    const init = def.getInitializer()

    if (!init) {
      const type = def.getTypeNode()
      if (!type) return

      if (Node.isTypeLiteral(type)) {
        stack.push(type)
        const maybeTypeValue = getTypeNodeValue(type, stack, ctx)
        if (isNotNullish(maybeTypeValue)) return box.from(maybeTypeValue, def, stack)
      }

      // skip evaluation if no initializer (only a type)
      // since ts-evaluator will throw an error
      return box.unresolvable(def, stack)
    }

    const initializer = unwrapExpression(init)
    const innerStack = [...stack, initializer]
    const maybeValue = maybeBoxNode(initializer, innerStack, ctx)
    if (maybeValue) return maybeValue
  }

  if (Node.isBindingElement(def)) {
    const init = def.getInitializer()
    if (!init) {
      const nameNode = def.getPropertyNameNode() ?? def.getNameNode()
      const propName = nameNode.getText()
      const innerStack = [...stack, nameNode]

      const value = maybeBindingElementValue(def, innerStack, propName, ctx)
      if (value) return value

      // skip evaluation if no initializer (only a type)
      // since ts-evaluator will throw an error
      return box.unresolvable(def, stack)
    }

    // { position = "absolute", ...props }
    const initializer = unwrapExpression(init)
    const innerStack = [...stack, initializer]
    const maybeValue = maybeBoxNode(initializer, innerStack, ctx)
    if (maybeValue) return maybeValue
  }
}

export const getExportedVarDeclarationWithName = (
  varName: string,
  sourceFile: SourceFile,
  stack: Node[],
  ctx: BoxContext,
): VariableDeclaration | undefined => {
  const maybeVar = sourceFile.getVariableDeclaration(varName)

  if (maybeVar) return maybeVar

  const exportDeclaration = resolveVarDeclarationFromExportWithName(varName, sourceFile, stack, ctx)
  if (!exportDeclaration) return

  return exportDeclaration
}

const hasNamedExportWithName = (name: string, exportDeclaration: ExportDeclaration) => {
  const namedExports = exportDeclaration.getNamedExports()

  // no namedExports means it's a full re-export like this: `export * from "xxx"`
  if (namedExports.length === 0) return true

  for (const namedExport of namedExports) {
    const exportedName = namedExport.getNameNode().getText()

    if (exportedName === name) {
      return true
    }
  }
}

/**
 * Faster than declaration.getModuleSpecifierSourceFile()
 *
 * since it does NOT require a call to `initializeTypeChecker`
 * > getModuleSpecifierSourceFile > getSymbol > getTypechecker > createTypeChecker > initializeTypeChecker
 *
 * which costs a minimum of around 90ms (and scales up with the file/project, could be hundreds of ms)
 * @see https://github.com/dsherret/ts-morph/blob/42d811ed9a5177fc678a5bfec4923a2048124fe0/packages/ts-morph/src/compiler/ast/module/ExportDeclaration.ts#L160
 */
export const getModuleSpecifierSourceFile = (declaration: ExportDeclaration | ImportDeclaration) => {
  const project = declaration.getProject()
  const moduleName = declaration.getModuleSpecifierValue()

  if (!moduleName) return

  const containingFile = declaration.getSourceFile().getFilePath()
  const resolved = ts.resolveModuleName(
    moduleName,
    containingFile,
    project.getCompilerOptions(),
    project.getModuleResolutionHost(),
  )
  if (!resolved.resolvedModule) return

  const sourceFile = project.addSourceFileAtPath(resolved.resolvedModule.resolvedFileName)

  return sourceFile
}

function resolveVarDeclarationFromExportWithName(
  symbolName: string,
  sourceFile: SourceFile,
  stack: Node[],
  ctx: BoxContext,
): VariableDeclaration | undefined {
  for (const exportDeclaration of sourceFile.getExportDeclarations()) {
    const exportStack = [exportDeclaration] as Node[]
    if (!hasNamedExportWithName(symbolName, exportDeclaration)) continue

    const maybeFile = getModuleSpecifierSourceFile(exportDeclaration)
    if (!maybeFile) continue

    exportStack.push(maybeFile)
    const maybeVar = getExportedVarDeclarationWithName(symbolName, maybeFile, stack, ctx)
    if (maybeVar) {
      stack.push(...exportStack.concat(maybeVar))
      return maybeVar
    }
  }
}

export const maybeIdentifierValue = (identifier: Identifier, _stack: Node[], ctx: BoxContext) => {
  const valueDeclaration = findIdentifierValueDeclaration(identifier, _stack, ctx)
  if (!valueDeclaration) {
    return box.unresolvable(identifier, _stack)
  }

  const declaration = unwrapExpression(valueDeclaration)

  const stack = [..._stack]
  const maybeValue = maybeDefinitionValue(declaration, stack, ctx)
  if (maybeValue) return maybeValue

  return box.unresolvable(identifier, stack)
}

const tryComputingPlusTokenBinaryExpressionToString = (node: BinaryExpression, stack: Node[], ctx: BoxContext) => {
  const left = unwrapExpression(node.getLeft())
  const right = unwrapExpression(node.getRight())

  const leftValue = maybePropName(left, stack, ctx)
  const rightValue = maybePropName(right, stack, ctx)
  if (!leftValue || !rightValue) return

  if (isNotNullish(leftValue.value) && isNotNullish(rightValue.value)) {
    return box.literal(String(leftValue.value) + String(rightValue.value), node, stack)
  }
}

const getElementAccessedExpressionValue = (
  expression: ElementAccessExpression,
  _stack: Node[],
  ctx: BoxContext,
): MaybeBoxNodeReturn => {
  const elementAccessed = unwrapExpression(expression.getExpression())
  const argExpr = expression.getArgumentExpression()
  if (!argExpr) return

  const arg = unwrapExpression(argExpr)
  const stack = [..._stack, elementAccessed, arg]
  const argLiteral = maybePropName(arg, stack, ctx)

  // <ColorBox color={xxx["yyy"]} />
  if (Node.isIdentifier(elementAccessed) && argLiteral) {
    if (!isNotNullish(argLiteral.value)) return

    return maybePropIdentifierValue(elementAccessed, [argLiteral.value.toString()], stack, ctx)
  }

  // <ColorBox color={xxx[yyy + "zzz"]} />
  if (Node.isBinaryExpression(arg)) {
    if (arg.getOperatorToken().getKind() !== ts.SyntaxKind.PlusToken) return

    const propName = tryComputingPlusTokenBinaryExpressionToString(arg, stack, ctx) ?? maybePropName(arg, stack, ctx)

    if (propName && Node.isIdentifier(elementAccessed)) {
      if (!isNotNullish(propName.value)) return

      return maybePropIdentifierValue(elementAccessed, [propName.value.toString()], stack, ctx)
    }
  }

  // <ColorBox color={xxx[`yyy`]} />
  if (Node.isTemplateExpression(arg)) {
    const propName = maybeTemplateStringValue(arg, stack, ctx)

    if (propName && Node.isIdentifier(elementAccessed)) {
      return maybePropIdentifierValue(elementAccessed, [propName], stack, ctx)
    }
  }

  // <ColorBox color={{ staticColor: "facebook.900" }["staticColor"]}></ColorBox>
  if (Node.isObjectLiteralExpression(elementAccessed) && argLiteral) {
    if (!isNotNullish(argLiteral.value)) return

    return getObjectLiteralPropValue(elementAccessed, [argLiteral.value.toString()], stack, ctx)
  }

  // <ColorBox color={xxx[yyy.zzz]} />
  if (Node.isPropertyAccessExpression(arg)) {
    return getPropertyAccessedExpressionValue(arg, [], stack, ctx)
  }

  // tokens.colors.blue["400"]
  if (Node.isPropertyAccessExpression(elementAccessed) && argLiteral && isNotNullish(argLiteral.value)) {
    const propRefValue = getPropertyAccessedExpressionValue(elementAccessed, [], stack, ctx)
    if (!propRefValue) return box.unresolvable(elementAccessed, stack)

    const propName = argLiteral.value.toString()

    if (box.isObject(propRefValue)) {
      const propValue = propRefValue.value[propName]
      return box.from(propValue, arg, stack)
    }

    if (box.isMap(propRefValue)) {
      const propValue = propRefValue.value.get(propName)
      return box.from(propValue, arg, stack)
    }

    if (box.isArray(propRefValue)) {
      const propValue = propRefValue.value[Number(propName)]
      return box.from(propValue, arg, stack)
    }

    return box.unresolvable(elementAccessed, stack)
  }

  // <ColorBox color={xxx[yyy[zzz]]} />
  if (Node.isIdentifier(elementAccessed) && Node.isElementAccessExpression(arg)) {
    const propName = getElementAccessedExpressionValue(arg, stack, ctx)

    if (typeof propName === 'string' && isNotNullish(propName)) {
      return maybePropIdentifierValue(elementAccessed, [propName], stack, ctx)
    }
  }

  // <ColorBox color={xxx[yyy["zzz"]]} />
  if (Node.isElementAccessExpression(elementAccessed) && argLiteral && isNotNullish(argLiteral.value)) {
    const identifier = getElementAccessedExpressionValue(elementAccessed, stack, ctx)

    if (isObject(identifier)) {
      const argValue = argLiteral.value.toString()

      if (box.isMap(identifier)) {
        const maybeValue = identifier.value.get(argValue)
        return maybeValue
      }

      if (box.isObject(identifier)) {
        const maybeLiteralValue = identifier.value[argValue]
        if (!maybeLiteralValue) return

        return box.from(maybeLiteralValue, expression, stack)
      }
    }
  }

  // <ColorBox color={xxx[[yyy][zzz]]} />
  if (Node.isArrayLiteralExpression(elementAccessed) && argLiteral) {
    return getArrayElementValueAtIndex(elementAccessed, Number(argLiteral.value), stack, ctx)
  }

  // <ColorBox color={xxx[aaa ? yyy : zzz]]} />
  if (Node.isConditionalExpression(arg)) {
    if (ctx.flags?.skipConditions) return box.unresolvable(arg, stack)

    const propName = maybePropName(arg, stack, ctx)
    if (isNotNullish(propName) && isNotNullish(propName.value)) {
      if (Node.isIdentifier(elementAccessed)) {
        return maybePropIdentifierValue(elementAccessed, [propName.value.toString()], stack, ctx)
      }
    }

    const whenTrueExpr = unwrapExpression(arg.getWhenTrue())
    const whenFalseExpr = unwrapExpression(arg.getWhenFalse())

    const whenTrueValue = maybePropName(whenTrueExpr, stack, ctx)
    const whenFalseValue = maybePropName(whenFalseExpr, stack, ctx)

    if (Node.isIdentifier(elementAccessed)) {
      const whenTrueResolved =
        whenTrueValue && isNotNullish(whenTrueValue.value)
          ? maybePropIdentifierValue(elementAccessed, [whenTrueValue.value.toString()], stack, ctx)
          : undefined
      const whenFalseResolved =
        whenFalseValue && isNotNullish(whenFalseValue.value)
          ? maybePropIdentifierValue(elementAccessed, [whenFalseValue.value.toString()], stack, ctx)
          : undefined

      if (!whenTrueResolved && !whenFalseResolved) {
        return
      }

      if (whenTrueResolved && !whenFalseResolved) {
        return whenTrueResolved
      }

      if (!whenTrueResolved && whenFalseResolved) {
        return whenFalseResolved
      }

      return box.conditional(whenTrueResolved!, whenFalseResolved!, arg, stack)
    }
  }
}

const getArrayElementValueAtIndex = (array: ArrayLiteralExpression, index: number, stack: Node[], ctx: BoxContext) => {
  const element = array.getElements()[index]
  if (!element) return

  const value = maybeBoxNode(element, stack, ctx)

  if (isNotNullish(value)) {
    return value
  }
}

const getPropertyAccessedExpressionValue = (
  expression: PropertyAccessExpression,
  _accessList: string[],
  stack: Node[],
  ctx: BoxContext,
): BoxNode | undefined => {
  const propName = expression.getName()
  const elementAccessed = unwrapExpression(expression.getExpression())
  const accessList = _accessList.concat(propName)

  stack.push(elementAccessed)

  // someObj.key
  if (Node.isIdentifier(elementAccessed)) {
    return maybePropIdentifierValue(elementAccessed, accessList, stack, ctx)
  }

  // someObj.key.nested
  if (Node.isPropertyAccessExpression(elementAccessed)) {
    const propValue = getPropertyAccessedExpressionValue(elementAccessed, accessList, stack, ctx)
    return propValue
  }

  // someObj["key"].nested
  if (Node.isElementAccessExpression(elementAccessed)) {
    const leftElementAccessed = getElementAccessedExpressionValue(elementAccessed, stack, ctx)
    if (!leftElementAccessed) return

    if (box.isObject(leftElementAccessed)) {
      const propValue = leftElementAccessed.value[propName]
      return box.from(propValue, expression, stack)
    }

    if (box.isMap(leftElementAccessed)) {
      const propValue = leftElementAccessed.value.get(propName)
      return box.from(propValue, expression, stack)
    }
  }
}
