import { Grid, panda, Wrap } from '../../../design-system/jsx'
import { analysisData } from '../../utils/analysis-data'
import { groupIn } from '../../utils/group-in'
import { getReportItem } from '../../utils/get-report-item'
import { TextWithCount } from './text-with-count'
import { TruncatedText } from './truncated-text'
import { gridItem, styledLink } from '../../../design-system/patterns'
import { Section } from './section'

export const ByCategory = ({ byCategory }: { byCategory: Record<string, number[]> }) => {
  const { unknown, ...rest } = byCategory
  const keys = Object.keys(rest)

  return (
    <Section p="0" title={<TextWithCount count={keys.length + 1}>Category utilities</TextWithCount>}>
      <Grid gap="4" columns={2}>
        {/* TODO filter out variants from recipes ? */}
        {keys.map((category) => (
          <CategoryUtilities key={category} category={category} byCategory={byCategory} />
        ))}
        <CategoryUtilities className={gridItem({ colSpan: 2 })} category="unknown" byCategory={byCategory} />
      </Grid>
    </Section>
  )
}

export const CategoryUtilities = ({
  category,
  byCategory,
  className,
}: {
  category: string
  byCategory: Record<string, number[]>
  className?: string
}) => {
  const reportItemIdList = byCategory[category as keyof typeof byCategory]

  const categoryTokens = reportItemIdList.map(getReportItem)
  const grouped = groupIn(categoryTokens, 'value')
  const values = Object.values(grouped)

  return (
    <panda.div key={category} p="4" bg="gray.50" className={className}>
      <TextWithCount count={values.length}>
        <panda.h4>{category}</panda.h4>
      </TextWithCount>
      <Wrap gap="2">
        {values.map((reportItem) => {
          const value = String(reportItem.value)
          const withTokenName = analysisData.details.globalMaps.byTokenName[value] ?? []
          const count = withTokenName?.filter((id) => getReportItem(id)?.propName === reportItem.propName)?.length

          return (
            <panda.a
              className={styledLink({})}
              key={reportItem.id}
              href={`/token-analyzer/utility?name=${reportItem.value}&category=${reportItem.category}&propName=${reportItem.propName}`}
            >
              <TextWithCount count={count}>
                {reportItem.propName}.<TruncatedText text={value} />
              </TextWithCount>
            </panda.a>
          )
        })}
      </Wrap>
    </panda.div>
  )
}
