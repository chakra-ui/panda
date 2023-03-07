import type { BoxNodeEmptyInitializer, BoxNodeLiteral, BoxNodeMap } from '@box-extractor/core'
import type { Config } from './config'

export type ReportItemType = 'object' | 'cva' | 'pattern' | 'recipe' | 'jsx' | 'jsx-factory'
export type ReportItem = {
  id: number
  from: string
  type: ReportItemType
  filepath: string
  kind: 'function' | 'component'
  path: string[]
  attrName: string
  propName: string
  value: string | number | true
  category: string
  box: BoxNodeLiteral | BoxNodeEmptyInitializer
}

export type ReportInstanceItem = Pick<ReportItem, 'from' | 'type' | 'kind' | 'filepath'> & {
  instanceId: number
  contains: Array<ReportItem['id']>
  value: Record<string, any>
  box: BoxNodeMap
}

export type ReportMaps = {
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

export type ReportCounts = {
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

export type MostUsedItem = { key: string; count: number }
export type ReportStats = {
  filesWithMostInstance: Record<string, number>
  filesWithMostPropValueCombinations: Record<string, number>
  mostUseds: {
    propNames: Array<MostUsedItem>
    tokens: Array<MostUsedItem>
    shorthands: Array<MostUsedItem>
    propertyPaths: Array<MostUsedItem>
    types: Array<MostUsedItem>
    instanceNames: Array<MostUsedItem>
    fromKinds: Array<MostUsedItem>
    instanceOfKinds: Array<MostUsedItem>
    colors: Array<MostUsedItem>
  }
}

export type ReportDetails = {
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

type FileSizes = {
  normal: string
  minified: string
  gzip: {
    normal: string
    minified: string
  }
}

export type AnalysisReport = ReportDetails & {
  fileSizes: FileSizes
}

type ReportMapsJSON = {
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

export type AnalysisReportJSON = {
  counts: ReportCounts
  stats: ReportStats
  details: {
    byId: Record<ReportItem['id'], ReportItem>
    byInstanceId: Record<ReportInstanceItem['instanceId'], ReportInstanceItem>
    byFilepath: Record<string, Array<ReportItem['id']>>
    byInstanceInFilepath: Record<string, Array<ReportInstanceItem['instanceId']>>
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
