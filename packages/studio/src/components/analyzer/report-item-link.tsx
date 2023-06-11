import type { ReportItemJSON } from '@pandacss/types'
import { panda } from '../../../styled-system/jsx'
import { styledLink } from '../../../styled-system/patterns'
import { analysisData } from '../../lib/analysis-data'
import {
  getReportItem,
  getUtilityLink,
  getReportRange,
  getReportRelativeFilePath,
  openReportItemInEditor,
  type SearchableReportItemAttributes,
} from '../../lib/get-report-item'
import { ExternalIcon } from './external-icon'
import { QuickTooltip } from './quick-tooltip'
import { TextWithCount } from './text-with-count'
import { TruncatedText } from './truncated-text'

export const ReportItemLink = (reportItem: Partial<ReportItemJSON>) => {
  const value = String(reportItem.value)
  const withTokenName = analysisData.details.globalMaps.byTokenName[value] ?? []
  const count = withTokenName?.filter((id) => getReportItem(id)?.propName === reportItem.propName)?.length

  return (
    <panda.a className={styledLink({})} href={getUtilityLink(reportItem)}>
      <TextWithCount count={count}>
        {reportItem.propName}.<TruncatedText text={value} />
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
    <panda.a
      className={styledLink({ color: String(value).endsWith('!') ? 'red.400' : undefined })}
      href={getUtilityLink(search)}
    >
      <TextWithCount count={(list ?? []).length}>
        <TruncatedText text={String(value)} />
      </TextWithCount>
    </panda.a>
  )
}

export const ReportItemOpenInEditorLink = ({ withRange, ...reportItem }: ReportItemJSON & { withRange?: boolean }) => {
  return (
    <panda.div display="flex" alignItems="center">
      <panda.a
        className={styledLink({ alignSelf: 'flex-start', mr: '2' })}
        href={getUtilityLink({ filepath: reportItem.filepath })}
      >
        {getReportRelativeFilePath(reportItem.filepath)}
        {withRange ? getReportRange(reportItem) : ''}
      </panda.a>
      <QuickTooltip
        tooltip={
          <panda.span p="2" bgColor="white" border="1px solid rgba(0, 0, 0, 0.1)">
            Click to open in editor
          </panda.span>
        }
      >
        <panda.div
          pos="relative"
          maxW="14px"
          flexShrink={0}
          cursor="pointer"
          onClickCapture={() => openReportItemInEditor(reportItem)}
        >
          <ExternalIcon />
        </panda.div>
      </QuickTooltip>
    </panda.div>
  )
}
