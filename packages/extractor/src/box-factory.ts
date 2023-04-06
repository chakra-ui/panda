import type { Node } from 'ts-morph'
import type { EvaluatedObjectResult, PrimitiveType } from './types'

type WithNode = { node: Node; stack: Node[] }

export type ObjectType = WithNode & {
  type: 'object'
  value: EvaluatedObjectResult
  isEmpty?: boolean
}

export type LiteralKind = 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined'

export type LiteralType = WithNode & {
  type: 'literal'
  value: PrimitiveType
  kind: LiteralKind
}

export type MapType = WithNode & { type: 'map'; value: MapTypeValue }

export type ArrayType = WithNode & { type: 'array'; value: BoxNode[] }

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
  | ArrayType
  | UnresolvableType
  | ConditionalType
  | EmptyInitializerType

export type BoxNode =
  | BoxNodeObject
  | BoxNodeLiteral
  | BoxNodeMap
  | BoxNodeArray
  | BoxNodeUnresolvable
  | BoxNodeConditional
  | BoxNodeEmptyInitializer

export type MapTypeValue = Map<string, BoxNode>

abstract class BoxNodeType<Definition extends BoxNodeDefinition = BoxNodeDefinition> {
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

export class BoxNodeArray extends BoxNodeType<ArrayType> {
  public value: ArrayType['value']
  constructor(definition: ArrayType) {
    super(definition)
    this.value = definition.value
  }
}

export class BoxNodeUnresolvable extends BoxNodeType<UnresolvableType> {}

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

export class BoxNodeEmptyInitializer extends BoxNodeType<EmptyInitializerType> {}

export const isBoxNode = (value: unknown): value is BoxNode => value instanceof BoxNodeType
