import type { EvaluateOptions } from 'ts-evaluator'
import type {
  CallExpression,
  Expression,
  JsxAttribute,
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SourceFile,
  TaggedTemplateExpression,
} from 'ts-morph'
import type { BoxNode, BoxNodeArray, BoxNodeLiteral, BoxNodeMap } from './box-factory'

export type PrimitiveType = string | number | boolean | null | undefined

export interface LiteralObject {
  [key: string]: any
}

export type SingleLiteralValue = PrimitiveType | LiteralObject

export type LiteralValue = SingleLiteralValue | SingleLiteralValue[]

export interface EvaluatedObjectResult {
  [key: string]: LiteralValue
}

export type ExtractResultKind = 'component' | 'function'

export interface ExtractedFunctionInstance {
  name: string
  kind: 'call-expression'
  fromNode: () => CallExpression
  box: BoxNodeArray
}

export interface ExtractedTaggedTemplateInstance {
  name: string
  kind: 'tagged-template'
  fromNode: () => TaggedTemplateExpression
  box: BoxNodeLiteral
}

export interface ExtractedFunctionResult {
  kind: 'function'
  nodesByProp: Map<string, BoxNode[]>
  queryList: Array<ExtractedFunctionInstance | ExtractedTaggedTemplateInstance>
}

export interface ExtractedComponentInstance {
  name: string
  fromNode: () => JsxOpeningElement | JsxSelfClosingElement
  box: BoxNodeMap
}
export interface ExtractedComponentResult {
  kind: 'component'
  nodesByProp: Map<string, BoxNode[]>
  queryList: ExtractedComponentInstance[]
}

export type ExtractResultItem = ExtractedComponentResult | ExtractedFunctionResult
export type ExtractResultByName = Map<string, ExtractResultItem>

export type ListOrAll = 'all' | string[]

export interface MatchTagArgs {
  tagName: string
  tagNode: JsxOpeningElement | JsxSelfClosingElement
  isFactory: boolean
}
export interface MatchPropArgs {
  propName: string
  propNode: JsxAttribute | undefined
}
export interface MatchFnArgs {
  fnName: string
  fnNode: CallExpression
}
export interface MatchFnArguments {
  argNode: Node
  index: number
}
export interface MatchFnPropArgs {
  propName: string
  propNode: PropertyAssignment | ShorthandPropertyAssignment
}
export type MatchPropFn = (prop: MatchPropArgs) => boolean
export interface FunctionMatchers {
  matchFn: (element: MatchFnArgs) => boolean
  matchArg: (arg: Pick<MatchFnArgs, 'fnName' | 'fnNode'> & MatchFnArguments) => boolean
  matchProp: (prop: Pick<MatchFnArgs, 'fnName' | 'fnNode'> & MatchFnPropArgs) => boolean
}

export interface ComponentMatchers {
  matchTag: (element: MatchTagArgs) => boolean
  matchProp: (prop: Pick<MatchTagArgs, 'tagName' | 'tagNode'> & MatchPropArgs) => boolean
}

export interface MatchTaggedTemplateArgs {
  fnName: string
  taggedTemplateNode: TaggedTemplateExpression
}
export type MatchTaggedTemplate = (tag: MatchTaggedTemplateArgs) => boolean

export interface BoxContext {
  getEvaluateOptions?: (node: Expression, stack: Node[]) => Omit<EvaluateOptions, 'node' | 'policy'> | void
  canEval?: (node: Expression, stack: Node[]) => boolean
  flags?: {
    skipEvaluate?: boolean
    skipTraverseFiles?: boolean
    skipConditions?: boolean
  }
}

export type ExtractOptions = BoxContext & {
  ast: SourceFile
  components?: ComponentMatchers
  functions?: FunctionMatchers
  taggedTemplates?: {
    matchTaggedTemplate: MatchTaggedTemplate
  }
}
