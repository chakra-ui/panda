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
} from 'ts-morph'
import type { BoxNode, BoxNodeList, BoxNodeMap } from './box-factory'

export type PrimitiveType = string | number | boolean | null | undefined

export type LiteralObject = Record<string, unknown>

export type SingleLiteralValue = PrimitiveType | LiteralObject

export type LiteralValue = SingleLiteralValue | SingleLiteralValue[]

export type EvaluatedObjectResult = Record<string, LiteralValue>

export type ExtractResultKind = 'component' | 'function'

export type ExtractedFunctionInstance = { name: string; fromNode: () => CallExpression; box: BoxNodeList }
export type ExtractedFunctionResult = {
  kind: 'function'
  nodesByProp: Map<string, BoxNode[]>
  queryList: ExtractedFunctionInstance[]
}

export type ExtractedComponentInstance = {
  name: string
  fromNode: () => JsxOpeningElement | JsxSelfClosingElement
  box: BoxNodeMap
}
export type ExtractedComponentResult = {
  kind: 'component'
  nodesByProp: Map<string, BoxNode[]>
  queryList: ExtractedComponentInstance[]
}

export type ExtractResultItem = ExtractedComponentResult | ExtractedFunctionResult
export type ExtractResultByName = Map<string, ExtractResultItem>

export type ListOrAll = 'all' | string[]

export type MatchTagArgs = {
  tagName: string
  tagNode: JsxOpeningElement | JsxSelfClosingElement
  isFactory: boolean
}
export type MatchPropArgs = {
  propName: string
  propNode: JsxAttribute | undefined
}
export type MatchFnArgs = {
  fnName: string
  fnNode: CallExpression
}
export type MatchFnArguments = {
  argNode: Node
  index: number
}
export type MatchFnPropArgs = {
  propName: string
  propNode: PropertyAssignment | ShorthandPropertyAssignment
}
export type MatchPropFn = (prop: MatchPropArgs) => boolean
export type FunctionMatchers = {
  matchFn: (element: MatchFnArgs) => boolean
  matchArg: (arg: Pick<MatchFnArgs, 'fnName' | 'fnNode'> & MatchFnArguments) => boolean
  matchProp: (prop: Pick<MatchFnArgs, 'fnName' | 'fnNode'> & MatchFnPropArgs) => boolean
}

export type ComponentMatchers = {
  matchTag: (element: MatchTagArgs) => boolean
  matchProp: (prop: Pick<MatchTagArgs, 'tagName' | 'tagNode'> & MatchPropArgs) => boolean
}

export type BoxContext = {
  getEvaluateOptions?: (node: Expression, stack: Node[]) => EvaluateOptions
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
  extractMap?: ExtractResultByName
}
