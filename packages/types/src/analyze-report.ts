import type { Config } from './config'

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

type Range = {
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

  path: string[]
  conditionName?: string | undefined
  propName: string
  value: string | number | boolean

  tokenType?: string
  isKnownValue: boolean

  range: Range
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
  range: Range
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
  fileSizes: FileSizes
  duration: {
    classify: number
    cssMs: number
    cssMinifyMs: number
    extractTotal: number
    extractTimeByFiles: Record<string, number>
    lightningCssMs?: number
    lightningCssMinifiedMs?: number
  }
}

interface FileSizes {
  normal: string
  minified: string
  gzip: {
    normal: string
    minified: string
  }
  lightningCss?: {
    normal: string
    minified: string
  }
}

export interface ReportSnapshot {
  schemaVersion: string
  details: ReportDetails
  config: Omit<Config, 'globalCss' | 'globalFontface'>

  propByIndex: Map<PropertyReportItem['index'], PropertyReportItem>
  componentByIndex: Map<ComponentReportItem['componentIndex'], ComponentReportItem>

  derived: {
    byFilepath: Map<string, Set<PropertyReportItem['index']>>
    byComponentInFilepath: Map<string, Set<ComponentReportItem['componentIndex']>>
    globalMaps: ReportDerivedMaps
    byFilePathMaps: Map<string, ReportDerivedMaps>
  }
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

export interface ReportSnapshotJSON extends Omit<ReportSnapshot, 'propByIndex' | 'componentByIndex' | 'derived'> {
  propByIndex: Record<PropertyReportItem['index'], PropertyReportItem>
  componentByIndex: Record<ComponentReportItem['componentIndex'], ComponentReportItem>

  derived: {
    byFilepath: Record<string, Array<PropertyReportItem['index']>>
    byComponentInFilepath: Record<string, Array<ComponentReportItem['componentIndex']>>
    globalMaps: ReportDerivedMapsJSON
    byFilePathMaps: Record<string, ReportDerivedMapsJSON>
  }
}
