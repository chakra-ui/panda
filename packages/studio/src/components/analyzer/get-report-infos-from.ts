import type { ReportItemJSON } from '@pandacss/types'
import { analysisData } from '../../utils/analysis-data'
import { getReportItem, SearchableReportItemAttributes } from '../../utils/get-report-item'

export const getReportInfosFrom = (params: SearchableReportItemAttributes) => {
  let byTokenName: Array<ReportItemJSON['id']> = []
  let byCategory: Array<ReportItemJSON['id']> = []
  let byPropName: Array<ReportItemJSON['id']> = []
  let byInstanceName: Array<ReportItemJSON['id']> = []
  let byFilepath: Array<ReportItemJSON['id']> = []
  let hasParam = false

  if (params.value) {
    byTokenName =
      analysisData.details.globalMaps.byTokenName[
        params.value as keyof typeof analysisData.details.globalMaps.byTokenName
      ] ?? []
    hasParam = true
  }

  if (params.category) {
    byCategory =
      analysisData.details.globalMaps.byCategory[
        params.category as keyof typeof analysisData.details.globalMaps.byCategory
      ] ?? []
    hasParam = true
  }

  if (params.propName) {
    byPropName =
      analysisData.details.globalMaps.byPropertyName[
        params.propName as keyof typeof analysisData.details.globalMaps.byPropertyName
      ] ?? []
    hasParam = true
  }

  if (params.from) {
    byInstanceName =
      analysisData.details.globalMaps.byInstanceName[
        params.from as keyof typeof analysisData.details.globalMaps.byInstanceName
      ] ?? []
    hasParam = true
  }

  if (params.filepath) {
    byFilepath = analysisData.details.byFilepath[params.filepath as keyof typeof analysisData.details.byFilepath] ?? []
    hasParam = true
  }

  return {
    params,
    hasParam,
    byTokenName: byTokenName.map(getReportItem),
    byCategory: byCategory.map(getReportItem),
    byPropName: byPropName.map(getReportItem),
    byInstanceName: byInstanceName.map(getReportItem),
    byFilepath: byFilepath.map(getReportItem),
    reportItemList: combineIntersections(byTokenName, byCategory, byPropName, byInstanceName, byFilepath).map(
      getReportItem,
    ),
  }
}
function combineIntersections<T>(...lists: Array<T[]>) {
  return lists.reduce((acc, current) => {
    if (!acc.length) return current

    if (!current.length) return acc

    return intersection(acc, current)
  }, [] as T[])
}
function intersection<T = any>(left: Array<T>, right: Array<T>) {
  const _intersection = new Set()
  for (const elem of right) {
    if (left.includes(elem)) {
      _intersection.add(elem)
    }
  }
  return Array.from(_intersection) as Array<T>
}
