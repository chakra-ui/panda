import type { BoxNodeEmptyInitializer, BoxNodeLiteral, BoxNodeMap } from '@pandacss/extractor'
import type { Config } from './config'

export type ReportItemType = 'object' | 'cva' | 'pattern' | 'recipe' | 'jsx' | 'jsx-factory'
export interface ReportItem {
  id: number
  from: string
  type: ReportItemType
  filepath: string
  kind: 'function' | 'component'
  path: string[]
  propName: string
  conditionName?: string | undefined
  value: string | number | true
  category: string
  isKnown: boolean
  box: BoxNodeLiteral | BoxNodeEmptyInitializer
}

/**
 * An instance is either a component usage or a function usage
 * @example an instance name could be 'Button', 'css', 'panda.div', 'vstack', ...
 */
export interface ReportInstanceItem extends Pick<ReportItem, 'from' | 'type' | 'kind' | 'filepath'> {
  instanceId: number
  contains: Array<ReportItem['id']>
  value: Record<string, any>
  box: BoxNodeMap
}

export interface ReportMaps {
  byInstanceOfKind: Map<'function' | 'component', Set<ReportInstanceItem['instanceId']>>
  byPropertyName: Map<string, Set<ReportItem['id']>>
  byCategory: Map<string, Set<ReportItem['id']>>
  byConditionName: Map<string, Set<ReportItem['id']>>
  byShorthand: Map<string, Set<ReportItem['id']>>
  byTokenName: Map<string, Set<ReportItem['id']>>
  byPropertyPath: Map<string, Set<ReportItem['id']>>
  fromKind: Map<'function' | 'component', Set<ReportItem['id']>>
  byType: Map<string, Set<ReportItem['id']>>
  byInstanceName: Map<string, Set<ReportItem['id']>>
  colorsUsed: Map<string, Set<ReportItem['id']>>
}

export interface ReportCounts {
  filesWithTokens: number
  propNameUsed: number
  tokenUsed: number
  shorthandUsed: number
  propertyPathUsed: number
  typeUsed: number
  instanceNameUsed: number
  kindUsed: number
  instanceOfKindUsed: number
  colorsUsed: number
}

export interface MostUsedItem {
  key: string
  count: number
}
export interface ReportStats {
  filesWithMostInstance: Record<string, number>
  filesWithMostPropValueCombinations: Record<string, number>
  mostUseds: {
    propNames: Array<MostUsedItem>
    tokens: Array<MostUsedItem>
    shorthands: Array<MostUsedItem>
    categories: Array<MostUsedItem>
    conditions: Array<MostUsedItem>
    propertyPaths: Array<MostUsedItem>
    types: Array<MostUsedItem>
    instanceNames: Array<MostUsedItem>
    fromKinds: Array<MostUsedItem>
    instanceOfKinds: Array<MostUsedItem>
    colors: Array<MostUsedItem>
  }
}

export interface ReportDetails {
  counts: ReportCounts
  stats: ReportStats
  details: {
    byId: Map<ReportItem['id'], ReportItem>
    byInstanceId: Map<ReportInstanceItem['instanceId'], ReportInstanceItem>
    byFilepath: Map<string, Set<ReportItem['id']>>
    byInstanceInFilepath: Map<string, Set<ReportInstanceItem['instanceId']>>
    globalMaps: ReportMaps
    byFilePathMaps: Map<string, ReportMaps>
  }
}

interface FileSizes {
  normal: string
  minified: string
  gzip: {
    normal: string
    minified: string
  }
}

export interface AnalysisReport extends ReportDetails {
  fileSizes: FileSizes
}

interface ReportMapsJSON {
  byInstanceOfKind: Record<'function' | 'component', Array<ReportInstanceItem['instanceId']>>
  byPropertyName: Record<string, Array<ReportItem['id']>>
  byCategory: Record<string, Array<ReportItem['id']>>
  byConditionName: Record<string, Array<ReportItem['id']>>
  byShorthand: Record<string, Array<ReportItem['id']>>
  byTokenName: Record<string, Array<ReportItem['id']>>
  byPropertyPath: Record<string, Array<ReportItem['id']>>
  fromKind: Record<'function' | 'component', Array<ReportItem['id']>>
  byType: Record<string, Array<ReportItem['id']>>
  byInstanceName: Record<string, Array<ReportItem['id']>>
  colorsUsed: Record<string, Array<ReportItem['id']>>
}

export interface ReportItemJSON {
  id: number
  from: string
  type: ReportItemType
  filepath: string
  kind: 'function' | 'component'
  path: string[]
  propName: string
  conditionName?: string | undefined
  value: string | number | true
  category: string
  isKnown: boolean
  box: {
    type: 'literal' | 'empty-initializer'
    value: string | number | boolean | undefined | null
    node: string
    stack: string[]
    line: number
    column: number
  }
}

export interface ReportInstanceItemJSON extends Pick<ReportItem, 'from' | 'type' | 'kind' | 'filepath'> {
  instanceId: number
  contains: Array<ReportItem['id']>
  value: Record<string, any>
  box: { type: 'map'; value: Record<string, any>; node: string; stack: string[]; line: number; column: number }
}

export interface AnalysisReportJSON {
  counts: ReportCounts
  stats: ReportStats
  details: {
    byId: Record<ReportItemJSON['id'], ReportItemJSON>
    byInstanceId: Record<ReportInstanceItemJSON['instanceId'], ReportInstanceItemJSON>
    byFilepath: Record<string, Array<ReportItemJSON['id']>>
    byInstanceInFilepath: Record<string, Array<ReportInstanceItemJSON['instanceId']>>
    globalMaps: ReportMapsJSON
    byFilePathMaps: Record<string, ReportMapsJSON>
  }
  fileSizes: FileSizes
  cwd: Config['cwd']
  theme: Config['theme']
  utilities: Config['utilities']
  conditions: Config['conditions']
  shorthands: Record<string, string>
  // Generator["parserOptions""]
  parserOptions: {
    importMap: {
      css: string
      recipe: string
      pattern: string
      jsx: string
    }
    jsx: {
      factory: string
      nodes: Array<{ type: 'string'; name: string; props: string[]; baseName: string }>
    }
  }
}
