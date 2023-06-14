import { Grid, panda, Stack, Wrap } from '../../../styled-system/jsx'
import { gridItem, styledLink } from '../../../styled-system/patterns'
import { getReportItem, getUtilityLink } from '../../lib/get-report-item'
import { groupBy } from '../../lib/group-in'
import { Section } from './section'
import { TextWithCount } from './text-with-count'
import { TruncatedText } from './truncated-text'

import { Portal, Select, SelectContent, SelectOption, SelectPositioner, SelectTrigger } from '@ark-ui/react'
import { useState } from 'react'
import { css, cx } from '../../../styled-system/css'
import { ReportItemLink } from './report-item-link'
import { SortIcon } from './sort-icon'

const selectOptionClass = css({ padding: '4px 8px', bg: 'white' })

type SortBy = 'property name' | 'tokens count'
const defaultOption = { label: 'tokens count', value: 'tokens count' as SortBy }

export const ByCategory = ({ byCategory }: { byCategory: Record<string, number[]> }) => {
  const { unknown, ...rest } = byCategory
  const keys = Object.keys(rest)
  const [sortedBy, setSortedBy] = useState<SortBy>('tokens count')

  return (
    <Section
      p="0"
      title={
        <span>
          <TextWithCount count={keys.length + 1}>Category </TextWithCount>
          <panda.span ml="2">utilities</panda.span>
        </span>
      }
      subTitle={
        <panda.div ml="auto">
          <Select
            onChange={(option) => setSortedBy((option?.value as SortBy) ?? 'tokens count')}
            defaultValue={defaultOption}
          >
            {({ selectedOption }) => (
              <>
                <SelectTrigger>
                  <panda.button display="flex" alignItems="center">
                    Sort by {selectedOption?.label}
                    <panda.div w="26px" ml="2">
                      <SortIcon />
                    </panda.div>
                  </panda.button>
                </SelectTrigger>
                <Portal>
                  <SelectPositioner>
                    <SelectContent className={cx(selectOptionClass, css({ listStyle: 'none' }))}>
                      <SelectOption
                        className={selectOptionClass}
                        value={defaultOption.value}
                        label={defaultOption.label}
                      />
                      <SelectOption className={selectOptionClass} value="property name" label="property name" />
                    </SelectContent>
                  </SelectPositioner>
                </Portal>
              </>
            )}
          </Select>
        </panda.div>
      }
    >
      <Grid gap="4" columns={2}>
        {/* TODO filter out variants from recipes ? */}
        {keys.map((category) => (
          <CategoryUtilities key={category} category={category} byCategory={byCategory} sortedBy={sortedBy} />
        ))}
        <CategoryUtilities
          className={gridItem({ colSpan: 2 })}
          category="unknown"
          byCategory={byCategory}
          sortedBy={sortedBy}
        />
      </Grid>
    </Section>
  )
}

const CategoryUtilities = ({
  category,
  byCategory,
  className,
  sortedBy,
}: {
  category: string
  byCategory: Record<string, number[]>
  className?: string
  sortedBy: SortBy
}) => {
  const reportItemIdList = byCategory[category as keyof typeof byCategory]

  const categoryTokens = reportItemIdList.map(getReportItem)
  const grouped = groupBy(categoryTokens, 'value')
  const values = Object.entries(grouped)
  const flattened = values.flatMap(([_value, reportItemList]) => reportItemList)

  const sorted = flattened
    .filter((item) => {
      return item === grouped[String(item.value)][0]
    })
    .sort((a, b) => {
      if (sortedBy === 'property name') {
        const result = a.propName.localeCompare(b.propName)
        if (result !== 0) {
          return result
        }

        return String(a.value).localeCompare(String(b.value))
      }

      if (sortedBy === 'tokens count') {
        return grouped[String(b.value)].length - grouped[String(a.value)].length
      }

      return 0
    })

  return (
    <Stack key={category} p="4" bg="card" color="text" gap="2" className={className}>
      <panda.h4>
        <panda.a className={styledLink({})} href={getUtilityLink({ category })}>
          <TextWithCount count={values.length}>
            <TruncatedText text={category} fontWeight="semibold" />
          </TextWithCount>
        </panda.a>
      </panda.h4>
      <Wrap gap="2">
        {sorted.map((reportItem) => {
          return (
            <ReportItemLink
              key={reportItem.id}
              value={reportItem.value}
              category={reportItem.category}
              propName={reportItem.propName}
            />
          )
        })}
      </Wrap>
    </Stack>
  )
}
