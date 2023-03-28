import type { Node } from 'ts-morph'
import type { MaybeObjectLikeBoxReturn } from './maybeObjectLikeBox'
import type { EvaluatedObjectResult, PrimitiveType } from './types'
import { isNotNullish, isObject } from './utils'

type WithNode = { node: Node; stack: Node[] }

export type ObjectType = WithNode & { type: 'object'; value: EvaluatedObjectResult; isEmpty?: boolean }
export type LiteralKind = 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined'
export type LiteralType = WithNode & {
  type: 'literal'
  value: PrimitiveType
  kind: LiteralKind
}
export type MapType = WithNode & { type: 'map'; value: MapTypeValue }
export type ListType = WithNode & { type: 'list'; value: BoxNode[] }
export type UnresolvableType = WithNode & { type: 'unresolvable' }

export type ConditionalKind = 'ternary' | 'and' | 'or' | 'nullish-coalescing'
export type ConditionalType = WithNode & {
  type: 'conditional'
  whenTrue: BoxNode
  whenFalse: BoxNode
  kind: ConditionalKind
}

/** -> Jsx boolean attribute <Box flex /> */
export type EmptyInitializerType = WithNode & { type: 'empty-initializer' }

// export type PrimitiveBoxNode = ObjectType | LiteralType | MapType
type BoxNodeDefinition =
  | ObjectType
  | LiteralType
  | MapType
  | ListType
  | UnresolvableType
  | ConditionalType
  | EmptyInitializerType

export type BoxNode =
  | BoxNodeObject
  | BoxNodeLiteral
  | BoxNodeMap
  | BoxNodeList
  | BoxNodeUnresolvable
  | BoxNodeConditional
  | BoxNodeEmptyInitializer
export type MapTypeValue = Map<string, BoxNode>

export abstract class BoxNodeType<Definition extends BoxNodeDefinition = BoxNodeDefinition> {
  public readonly type: Definition['type']
  private readonly stack: Node[] = []
  private readonly node: Definition['node']

  constructor(definition: Definition) {
    this.type = definition.type
    this.node = definition.node
    this.stack = [...(definition.stack ?? [])]
  }

  getNode(): Node {
    return this.node
  }

  getStack(): Node[] {
    return this.stack
  }

  isObject(): this is BoxNodeObject {
    return this.type === 'object'
  }
  isLiteral(): this is BoxNodeLiteral {
    return this.type === 'literal'
  }
  isMap(): this is BoxNodeMap {
    return this.type === 'map'
  }
  isList(): this is BoxNodeList {
    return this.type === 'list'
  }
  isUnresolvable(): this is BoxNodeUnresolvable {
    return this.type === 'unresolvable'
  }
  isConditional(): this is BoxNodeConditional {
    return this.type === 'conditional'
  }
  isEmptyInitializer(): this is BoxNodeEmptyInitializer {
    return this.type === 'empty-initializer'
  }
}

export class BoxNodeObject extends BoxNodeType<ObjectType> {
  public value: ObjectType['value']
  public isEmpty: ObjectType['isEmpty']
  constructor(definition: ObjectType) {
    super(definition)
    this.value = definition.value
    this.isEmpty = definition.isEmpty
  }
}

export class BoxNodeLiteral extends BoxNodeType<LiteralType> {
  public value: LiteralType['value']
  public kind: LiteralType['kind']
  constructor(definition: LiteralType) {
    super(definition)
    this.value = definition.value
    this.kind = definition.kind
  }
}

export class BoxNodeMap extends BoxNodeType<MapType> {
  public value: MapType['value']
  public spreadConditions?: BoxNodeConditional[]

  constructor(definition: MapType) {
    super(definition)
    this.value = definition.value
  }
}

export class BoxNodeList extends BoxNodeType<ListType> {
  public value: ListType['value']
  constructor(definition: ListType) {
    super(definition)
    this.value = definition.value
  }
}

export class BoxNodeUnresolvable extends BoxNodeType<UnresolvableType> {
  // constructor(definition: UnresolvableType) {
  //     super(definition);
  // }
}

export class BoxNodeConditional extends BoxNodeType<ConditionalType> {
  public whenTrue: ConditionalType['whenTrue']
  public whenFalse: ConditionalType['whenFalse']
  public kind: ConditionalType['kind']
  constructor(definition: ConditionalType) {
    super(definition)
    this.whenTrue = definition.whenTrue
    this.whenFalse = definition.whenFalse
    this.kind = definition.kind
  }
}

export class BoxNodeEmptyInitializer extends BoxNodeType<EmptyInitializerType> {
  // constructor(definition: EmptyInitializerType) {
  //     super(definition);
  // }
}

export const isBoxNode = (value: unknown): value is BoxNode => value instanceof BoxNodeType

const getTypeOfLiteral = (value: PrimitiveType | PrimitiveType[]): LiteralKind => {
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  throw new Error(`Unexpected literal type: ${value as any}`)
}

const boxTypeFactory = {
  object(value: EvaluatedObjectResult, node: Node, stack: Node[]) {
    return new BoxNodeObject({ type: 'object', value, node, stack })
  },
  literal(value: PrimitiveType, node: Node, stack: Node[]) {
    return new BoxNodeLiteral({ type: 'literal', value, kind: getTypeOfLiteral(value), node, stack })
  },
  map(value: MapTypeValue, node: Node, stack: Node[]) {
    return new BoxNodeMap({ type: 'map', value, node, stack })
  },
  list(value: BoxNode[], node: Node, stack: Node[]) {
    return new BoxNodeList({ type: 'list', value, node, stack })
  },
  conditional(whenTrue: BoxNode, whenFalse: BoxNode, node: Node, stack: Node[], kind: ConditionalKind) {
    return new BoxNodeConditional({ type: 'conditional', whenTrue, whenFalse, kind, node, stack })
  },
  cast: toBoxType,
  //
  emptyObject: (node: Node, stack: Node[]) => {
    return new BoxNodeObject({ type: 'object', value: {}, isEmpty: true, node, stack })
  },
  emptyInitializer: (node: Node, stack: Node[]) => {
    return new BoxNodeEmptyInitializer({ type: 'empty-initializer', node, stack })
  },
  unresolvable: (node: Node, stack: Node[]) => {
    return new BoxNodeUnresolvable({ type: 'unresolvable', node, stack })
  },
  // asserts
  isObject(value: BoxNode): value is BoxNodeObject {
    return value.type === 'object'
  },
  isLiteral(value: BoxNode): value is BoxNodeLiteral {
    return value.type === 'literal'
  },
  isMap(value: BoxNode): value is BoxNodeMap {
    return value.type === 'map'
  },
  isList(value: BoxNode): value is BoxNodeList {
    return value.type === 'list'
  },
  isUnresolvable(value: BoxNode): value is BoxNodeUnresolvable {
    return value.type === 'unresolvable'
  },
  isConditional(value: BoxNode): value is BoxNodeConditional {
    return value.type === 'conditional'
  },
  isEmptyInitializer(value: BoxNode): value is BoxNodeEmptyInitializer {
    return value.type === 'empty-initializer'
  },
}

export const box = boxTypeFactory

export const isPrimitiveType = (value: unknown): value is PrimitiveType => {
  const type = typeof value
  return type === 'string' || type === 'number' || type === 'boolean' || value === null || value === undefined
}

export type LiteralObject = Record<string, unknown>
export type SingleLiteralValue = PrimitiveType | LiteralObject
export type LiteralValue = SingleLiteralValue | SingleLiteralValue[]

function toBoxType<Value extends PrimitiveType>(value: Value, node: Node, stack: Node[]): BoxNodeLiteral
function toBoxType<Value extends EvaluatedObjectResult>(value: Value, node: Node, stack: Node[]): BoxNodeObject
function toBoxType<Value extends PrimitiveType[]>(value: Value, node: Node, stack: Node[]): BoxNodeLiteral[]
function toBoxType<Value extends BoxNode | BoxNode[]>(value: Value, node: Node, stack: Node[]): Value
function toBoxType<Value extends LiteralValue>(
  value: Value,
  node: Node,
  stack: Node[],
): Value extends unknown[] ? BoxNodeLiteral : Value extends PrimitiveType ? BoxNodeLiteral : BoxNodeObject
function toBoxType<Value extends PrimitiveType | BoxNode>(value: Value, node: Node, stack: Node[]): BoxNodeLiteral
function toBoxType<Value>(value: Value, node: Node, stack: Node[]): BoxNode | BoxNode[] | undefined {
  if (!isNotNullish(value)) return
  if (isBoxNode(value)) return value

  if (isObject(value) && !Array.isArray(value)) {
    return box.object(value as EvaluatedObjectResult, node, stack)
  }

  if (Array.isArray(value)) {
    if (value.length === 1) return toBoxType(value[0], node, stack)
    return value.map((item) => toBoxType(item, node, stack) as BoxNode)
  }

  if (isPrimitiveType(value)) return box.literal(value, node, stack)
}

export const castObjectLikeAsMapValue = (maybeObject: MaybeObjectLikeBoxReturn, node: Node): MapTypeValue => {
  if (!maybeObject) return new Map<string, BoxNode>()
  if (!isBoxNode(maybeObject)) return new Map<string, BoxNode>(Object.entries(maybeObject))
  if (maybeObject.isUnresolvable() || maybeObject.isConditional()) return new Map<string, BoxNode>()
  if (box.isMap(maybeObject)) return maybeObject.value

  // console.dir({ entries }, { depth: null });
  return new Map<string, BoxNode>(
    Object.entries(maybeObject.value)
      .map(([key, value]) => {
        const boxed = box.cast(value, maybeObject.getNode() ?? node, maybeObject.getStack() ?? [])
        if (!boxed) return [key, null]
        return [key, boxed]
      })
      .filter(([, value]) => value !== null) as Array<[string, BoxNodeObject | BoxNodeLiteral]>,
  )
}
