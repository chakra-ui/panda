import type { Node } from 'ts-morph'
import type { EvaluatedObjectResult, PrimitiveType } from './types'
import { getNodeRange } from './get-node-range'

interface WithNode {
  node: Node
  stack: Node[]
}

export interface ObjectType extends WithNode {
  type: 'object'
  value: EvaluatedObjectResult
  isEmpty?: boolean
}

export type LiteralKind = 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined'

export interface LiteralType extends WithNode {
  type: 'literal'
  value: PrimitiveType
  kind: LiteralKind
}

export interface MapType extends WithNode {
  type: 'map'
  value: MapTypeValue
}

export interface ArrayType extends WithNode {
  type: 'array'
  value: BoxNode[]
}

export interface UnresolvableType extends WithNode {
  type: 'unresolvable'
}

export interface ConditionalType extends WithNode {
  type: 'conditional'
  whenTrue: BoxNode
  whenFalse: BoxNode
}

/** -> Jsx boolean attribute <Box flex /> */
export interface EmptyInitializerType extends WithNode {
  type: 'empty-initializer'
}

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

  getRange = () => getNodeRange(this.node)

  toJSON() {
    const range = this.getRange()

    return {
      type: this.type,
      // @ts-expect-error
      value: this.value,
      node: this.node.getKindName(),
      line: range.startLineNumber,
      column: range.startColumn,
    }
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2)
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
  constructor(definition: ConditionalType) {
    super(definition)
    this.whenTrue = definition.whenTrue
    this.whenFalse = definition.whenFalse
  }
}

export class BoxNodeEmptyInitializer extends BoxNodeType<EmptyInitializerType> {}

export const isBoxNode = (value: unknown): value is BoxNode => value instanceof BoxNodeType
