import type { ReportItemJSON } from '@pandacss/types'
import { panda } from '../../../design-system/jsx'
import { styledLink } from '../../../design-system/patterns'
import { analysisData } from '../../utils/analysis-data'
import {
  getReportItem,
  getReportItemLink,
  getReportRange,
  getReportRelativeFilePath,
  openReportItemInEditor,
  SearchableReportItemAttributes,
} from '../../utils/get-report-item'
import { TextWithCount } from './text-with-count'

export const ReportItemLink = (reportItem: Partial<ReportItemJSON>) => {
  const value = String(reportItem.value)
  const withTokenName = analysisData.details.globalMaps.byTokenName[value] ?? []
  const count = withTokenName?.filter((id) => getReportItem(id)?.propName === reportItem.propName)?.length

  return (
    <panda.a className={styledLink({})} href={getReportItemLink(reportItem)}>
      <TextWithCount count={count}>
        {reportItem.propName}.{value}
      </TextWithCount>
    </panda.a>
  )
}

const mapsByReportItemAttribute = {
  propName: analysisData.details.globalMaps.byPropertyName,
  value: analysisData.details.globalMaps.byTokenName,
  category: analysisData.details.globalMaps.byCategory,
  from: analysisData.details.globalMaps.byInstanceName,
  filepath: analysisData.details.byFilepath,
}

/** Takes a single search param */
export const UtilityLink = (search: SearchableReportItemAttributes) => {
  const value = search.value ?? search.propName ?? search.category ?? search.filepath ?? search.from

  let list: number[] | undefined
  if (search.value) {
    list = mapsByReportItemAttribute.value[String(search.value)]
  } else if (search.propName) {
    list = mapsByReportItemAttribute.propName[search.propName]
  } else if (search.category) {
    list = mapsByReportItemAttribute.category[search.category]
  } else if (search.filepath) {
    list = mapsByReportItemAttribute.filepath[search.filepath]
  } else if (search.from) {
    list = mapsByReportItemAttribute.from[search.from]
  }

  return (
    <panda.a className={styledLink({})} href={getReportItemLink(search)}>
      <TextWithCount count={(list ?? []).length}>{value}</TextWithCount>
    </panda.a>
  )
}

export const ReportItemOpenInEditorLink = ({ withRange, ...reportItem }: ReportItemJSON & { withRange?: boolean }) => {
  return (
    <panda.span className={styledLink({ alignSelf: 'flex-start' })} onClick={() => openReportItemInEditor(reportItem)}>
      {getReportRelativeFilePath(reportItem.filepath)}
      {withRange ? getReportRange(reportItem) : ''}
    </panda.span>
  )
}
