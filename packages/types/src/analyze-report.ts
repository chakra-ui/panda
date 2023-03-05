import type { BoxNodeEmptyInitializer, BoxNodeLiteral, BoxNodeMap } from '@box-extractor/core'

export type ReportItemType = 'object' | 'cva' | 'pattern' | 'recipe' | 'jsx' | 'jsx-factory'
export type ReportItem = {
  id: number
  from: string
  type: ReportItemType
  filepath: string
  kind: 'function' | 'component'
  path: string[]
  value: string | number | true
  box: BoxNodeLiteral | BoxNodeEmptyInitializer
}

export type ReportInstanceItem = Pick<ReportItem, 'from' | 'type' | 'filepath'> & {
  instanceId: number
  value: Record<string, any>
  box: BoxNodeMap
}
