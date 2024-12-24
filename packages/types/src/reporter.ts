import type { ParserResultInterface } from './parser'

export type ReportItemType =
  | 'css'
  | 'cva'
  | 'sva'
  | 'pattern'
  | 'recipe'
  | 'jsx-factory'
  | 'jsx-pattern'
  | 'jsx-recipe'
  | 'jsx'

type ComponentKind = 'component' | 'function'

interface PropertyLocationRange {
  startPosition: number
  startLineNumber: number
  startColumn: number
  endPosition: number
  endLineNumber: number
  endColumn: number
}

export interface PropertyReportItem {
  index: string
  componentIndex: ComponentReportItem['componentIndex']
  componentName: ComponentReportItem['componentName']
  reportItemKind: 'token' | 'utility'
  reportItemType: ReportItemType

  path: string[]
  conditionName?: string | undefined
  propName: string
  value: string | number | boolean

  tokenType?: string
  isKnownValue: boolean

  range: PropertyLocationRange | null
  filepath: string
}

/**
 * An component is either a component usage or a function usage
 * @example an component name could be 'Button', 'css', 'panda.div', 'vstack', ...
 */
export interface ComponentReportItem extends Pick<PropertyReportItem, 'filepath'> {
  componentIndex: string
  componentName: string
  reportItemType: ReportItemType
  kind: ComponentKind
  contains: Array<PropertyReportItem['index']>
  value: Record<string, any>
  range: PropertyLocationRange | null
  debug?: boolean
}

export interface ReportDerivedMaps {
  byComponentOfKind: Map<ComponentKind, Set<ComponentReportItem['componentIndex']>>
  byPropertyName: Map<string, Set<PropertyReportItem['index']>>
  byTokenType: Map<string, Set<PropertyReportItem['index']>>
  byConditionName: Map<string, Set<PropertyReportItem['index']>>
  byShorthand: Map<string, Set<PropertyReportItem['index']>>
  byTokenName: Map<string, Set<PropertyReportItem['index']>>
  byPropertyPath: Map<string, Set<PropertyReportItem['index']>>
  fromKind: Map<ComponentKind, Set<PropertyReportItem['index']>>
  byType: Map<string, Set<PropertyReportItem['index']>>
  byComponentName: Map<string, Set<PropertyReportItem['index']>>
  colorsUsed: Map<string, Set<PropertyReportItem['index']>>
}

interface ReportDerivedMapsJSON {
  byComponentOfKind: Record<ComponentKind, Array<ComponentReportItem['componentIndex']>>
  byPropertyName: Record<string, Array<PropertyReportItem['index']>>
  byTokenType: Record<string, Array<PropertyReportItem['index']>>
  byConditionName: Record<string, Array<PropertyReportItem['index']>>
  byShorthand: Record<string, Array<PropertyReportItem['index']>>
  byTokenName: Record<string, Array<PropertyReportItem['index']>>
  byPropertyPath: Record<string, Array<PropertyReportItem['index']>>
  fromKind: Record<ComponentKind, Array<PropertyReportItem['index']>>
  byType: Record<string, Array<PropertyReportItem['index']>>
  byComponentName: Record<string, Array<PropertyReportItem['index']>>
  colorsUsed: Record<string, Array<PropertyReportItem['index']>>
}

export interface ReportCounts {
  filesWithTokens: number
  propNameUsed: number
  tokenUsed: number
  shorthandUsed: number
  propertyPathUsed: number
  typeUsed: number
  componentNameUsed: number
  kindUsed: number
  componentOfKindUsed: number
  colorsUsed: number
}

export interface MostUsedItem {
  key: string
  count: number
}

export interface ReportStats {
  filesWithMostComponent: Record<string, number>
  mostUseds: {
    propNames: Array<MostUsedItem>
    tokens: Array<MostUsedItem>
    shorthands: Array<MostUsedItem>
    categories: Array<MostUsedItem>
    conditions: Array<MostUsedItem>
    propertyPaths: Array<MostUsedItem>
    types: Array<MostUsedItem>
    componentNames: Array<MostUsedItem>
    fromKinds: Array<MostUsedItem>
    componentOfKinds: Array<MostUsedItem>
    colors: Array<MostUsedItem>
  }
}

export interface ReportDetails {
  counts: ReportCounts
  stats: ReportStats
}

export interface AnalysisOptions {
  onResult?: (file: string, result: ParserResultInterface) => void
}

interface ReportDerivedMap {
  byFilepath: Map<string, Set<PropertyReportItem['index']>>
  byComponentInFilepath: Map<string, Set<ComponentReportItem['componentIndex']>>
  globalMaps: ReportDerivedMaps
  byFilePathMaps: Map<string, ReportDerivedMaps>
}

interface ReportDerivedMapJSON {
  byFilepath: Record<string, Array<PropertyReportItem['index']>>
  byComponentInFilepath: Record<string, Array<ComponentReportItem['componentIndex']>>
  globalMaps: ReportDerivedMapsJSON
  byFilePathMaps: Record<string, ReportDerivedMapsJSON>
}

export interface AnalysisReport {
  schemaVersion: string
  details: ReportDetails

  propByIndex: Map<PropertyReportItem['index'], PropertyReportItem>
  componentByIndex: Map<ComponentReportItem['componentIndex'], ComponentReportItem>

  derived: ReportDerivedMap
}

export interface ReportSnapshotJSON extends Omit<AnalysisReport, 'propByIndex' | 'componentByIndex' | 'derived'> {
  propByIndex: Record<PropertyReportItem['index'], PropertyReportItem>
  componentByIndex: Record<ComponentReportItem['componentIndex'], ComponentReportItem>
  derived: ReportDerivedMapJSON
}

export interface ClassifyReport {
  propById: Map<string, PropertyReportItem>
  componentById: Map<ComponentReportItem['componentIndex'], ComponentReportItem>
  details: Pick<ReportDetails, 'counts' | 'stats'>
  derived: ReportDerivedMap
}
