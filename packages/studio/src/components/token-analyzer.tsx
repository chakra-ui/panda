import { css, cx } from '../../styled-system/css'
import { panda, Stack, Wrap } from '../../styled-system/jsx'
import { analysisData } from '../lib/analysis-data'

import {
  Portal,
  Select,
  SelectContent,
  SelectLabel,
  SelectOption,
  SelectPositioner,
  SelectTrigger,
  Tooltip,
  TooltipContent,
  TooltipPositioner,
  TooltipTrigger,
} from '@ark-ui/react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ark-ui/react'
import { stack } from '../../styled-system/patterns/stack'

import { styledLink } from '../../styled-system/patterns'
import { getReportItem, getUtilityLink, getReportRelativeFilePath, getFileLink } from '../lib/get-report-item'
import { pick } from '../lib/pick'
import { ReportItemLink } from './analyzer/report-item-link'
import { Section } from './analyzer/section'
import { TextWithCount } from './analyzer/text-with-count'
import { TruncatedText } from './analyzer/truncated-text'
import { ByCategory } from './analyzer/category-utilities'
import { ColorItem } from './color-item'
import { TokenSearchCombobox } from './analyzer/token-search-combobox'
import { useState } from 'react'
import { SortIcon } from './analyzer/sort-icon'

export function TokenAnalyzer() {
  // console.log(tokenDictionary)
  // console.log(analysisData)

  return (
    <div className={css({ width: '100%', py: '20px', debug: false })}>
      <panda.div px="24" w="100%">
        <HeadlineSummary />
        <TokenSearchCombobox />
        <MostUsedList />
        <ColorPalette />
        <ByCategory byCategory={analysisData.details.globalMaps.byCategory} />
        <FilesAccordionList />
      </panda.div>
    </div>
  )
}

const [topKind, secondKind] = analysisData.stats.mostUseds.instanceOfKinds

const values = Object.values(analysisData.details.byId)
const withImportant = values.filter((reportItem) => String(reportItem.value).endsWith('!'))

const knownValues = values.filter((reportItem) => reportItem.isKnown)
const unknownValuesCount = values.length - knownValues.length
const formater = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'percent',
})

const HeadlineSummary = () => {
  return (
    <Stack mb="4" direction="column" align="center" p="20px" fontSize="lg">
      <div>
        <panda.span fontSize="xl" fontWeight="bold">
          {Object.keys(analysisData.details.byId).length}
        </panda.span>{' '}
        token usage including{' '}
        <panda.span fontSize="xl" fontWeight="bold">
          <panda.a className={styledLink({})} href={getUtilityLink({ category: 'colors' })}>
            {analysisData.counts.colorsUsed}
          </panda.a>
        </panda.span>{' '}
        colors found in{' '}
        <panda.span fontSize="xl" fontWeight="bold">
          {analysisData.counts.filesWithTokens}
        </panda.span>{' '}
        files
      </div>
      <panda.div fontSize="md">
        with{' '}
        <Tooltip openDelay={0} closeDelay={100} positioning={{ placement: 'bottom-start', gutter: 20 }}>
          <TooltipTrigger>
            <span>
              <panda.span fontSize="lg" fontWeight="bold">
                {analysisData.fileSizes.gzip.minified}
              </panda.span>{' '}
              KB corresponding CSS generated (min+gzip)
            </span>
          </TooltipTrigger>
          <Portal>
            <TooltipPositioner>
              <TooltipContent>
                <panda.span p="2" bg="gray.100" border="1px solid rgba(0, 0, 0, 0.1)" rounded="md">
                  <panda.span fontSize="lg" fontWeight="bold">
                    {analysisData.fileSizes.normal}
                  </panda.span>{' '}
                  (unmin+uncompressed)
                </panda.span>
              </TooltipContent>
            </TooltipPositioner>
          </Portal>
        </Tooltip>
      </panda.div>
      {topKind && (
        <panda.div fontSize="md">
          <span>Mostly </span>
          {
            <TextWithCount display="inline-block" count={topKind.count}>
              {topKind.key === 'function' ? 'using functions' : 'using style props'}
            </TextWithCount>
          }
          {secondKind && (
            <>
              , and others{' '}
              <TextWithCount display="inline-block" count={secondKind.count}>
                {secondKind.key === 'function' ? 'using functions' : 'using style props'}.
              </TextWithCount>
            </>
          )}
        </panda.div>
      )}
      <panda.div fontSize="sm">
        <span>
          With{' '}
          <panda.span fontSize="md" fontWeight="bold">
            {unknownValuesCount}
          </panda.span>{' '}
          unknown token values (
          <panda.span fontSize="md" fontWeight="bold">
            {formater.format(unknownValuesCount / values.length)}
          </panda.span>
          ) and{' '}
          <panda.span fontSize="md" fontWeight="bold">
            {withImportant.length}
          </panda.span>{' '}
          values marked as important (
          <panda.span fontSize="md" fontWeight="bold">
            {formater.format(withImportant.length / values.length)}
          </panda.span>
          )
        </span>
      </panda.div>
    </Stack>
  )
}

const selectOptionClass = css({
  padding: '4px 8px',
  bg: 'card',
  rounded: 'md',
  '& li': {
    cursor: 'pointer',
    _hover: { opacity: 0.8 },
  },
})

const MostUsedList = () => {
  return (
    <>
      <Select defaultValue={{ label: 'tokens', value: 'tokens' }}>
        {({ selectedOption }) => (
          <Section
            title={
              <>
                <SelectLabel>Top 10 </SelectLabel>
                <SelectTrigger>
                  <button>{selectedOption?.label}</button>
                </SelectTrigger>
              </>
            }
            bg="card"
          >
            {mostUsedByName[selectedOption?.value as keyof typeof mostUsedByName]}
            <>
              <Portal>
                <SelectPositioner>
                  <SelectContent className={cx(selectOptionClass, css({ listStyle: 'none' }))}>
                    <SelectOption className={selectOptionClass} value="tokens" label="tokens" />
                    <SelectOption className={selectOptionClass} value="properties" label="properties" />
                    <SelectOption className={selectOptionClass} value="categories" label="categories" />
                    <SelectOption className={selectOptionClass} value="conditions" label="conditions" />
                    <SelectOption className={selectOptionClass} value="propertyPaths" label="property paths" />
                    <SelectOption className={selectOptionClass} value="shorthands" label="shorthands" />
                    <SelectOption className={selectOptionClass} value="instances" label="instances" />
                    <SelectOption className={selectOptionClass} value="types" label="types" />
                  </SelectContent>
                </SelectPositioner>
              </Portal>
            </>
          </Section>
        )}
      </Select>
    </>
  )
}

const MostUsedItem = ({
  entries,
}: {
  entries: Array<{
    key: string
    count: number
  }>
}) => {
  return (
    <Wrap gap="4" fontSize="sm">
      {entries.map(({ key, count }) => {
        return (
          <panda.a className={styledLink({})} key={key} href={getUtilityLink({ value: key })}>
            <TextWithCount count={count}>{key}</TextWithCount>
          </panda.a>
        )
      })}
    </Wrap>
  )
}

const mostUsedByName = {
  tokens: <MostUsedItem entries={analysisData.stats.mostUseds.tokens} />,
  properties: <MostUsedItem entries={analysisData.stats.mostUseds.propNames} />,
  shorthands: <MostUsedItem entries={analysisData.stats.mostUseds.shorthands} />,
  categories: <MostUsedItem entries={analysisData.stats.mostUseds.categories} />,
  conditions: <MostUsedItem entries={analysisData.stats.mostUseds.conditions} />,
  propertyPaths: <MostUsedItem entries={analysisData.stats.mostUseds.propertyPaths} />,
  instances: <MostUsedItem entries={analysisData.stats.mostUseds.instanceNames} />,
  types: <MostUsedItem entries={analysisData.stats.mostUseds.types} />,
}

const ColorPalette = () => {
  return (
    <Section
      title={<TextWithCount count={analysisData.stats.mostUseds.colors.length}>Color palette</TextWithCount>}
      bg="card"
    >
      <Wrap gap="2" fontSize="sm">
        {analysisData.stats.mostUseds.colors.map(({ key, count }) => (
          <ColorItem
            tokenName={key}
            key={key}
            py="2"
            px="4"
            transition="all 0.2s ease"
            rounded="md"
            _hover={{ bgColor: 'border' }}
          >
            <TextWithCount count={count}>
              <TruncatedText text={key} />
            </TextWithCount>
          </ColorItem>
        ))}
      </Wrap>
    </Section>
  )
}

const FilesAccordionList = () => {
  const entries = Object.entries(analysisData.details.byFilepath)

  const [sortedBy, setSortedBy] = useState<'name' | 'tokens count' | 'file path'>('file path')
  const sorted = entries.sort((a, b) => {
    if (sortedBy === 'name') {
      return a[0].localeCompare(b[0])
    }

    if (sortedBy === 'tokens count') {
      return b[1].length - a[1].length
    }

    return 0
  })

  return (
    <Section
      p="0"
      title={<TextWithCount count={sorted.length}>Files</TextWithCount>}
      subTitle={
        <panda.div ml="auto">
          <Select onChange={(option) => setSortedBy((option?.value as any) ?? 'file path')}>
            {({ selectedOption }) => (
              <>
                <SelectTrigger>
                  <panda.button display="flex" alignItems="center" cursor="pointer" _hover={{ opacity: 0.6 }}>
                    Sort by {selectedOption?.label}
                    <panda.div w="5" ml="2" color="text">
                      <SortIcon />
                    </panda.div>
                  </panda.button>
                </SelectTrigger>
                <Portal>
                  <SelectPositioner>
                    <SelectContent className={cx(selectOptionClass, css({ listStyle: 'none' }))}>
                      <SelectOption className={selectOptionClass} value="name" label="name" />
                      <SelectOption className={selectOptionClass} value="tokens count" label="tokens count" />
                      <SelectOption className={selectOptionClass} value="file path" label="file path" />
                    </SelectContent>
                  </SelectPositioner>
                </Portal>
              </>
            )}
          </Select>
        </panda.div>
      }
    >
      <Accordion className={stack({ gap: '2', px: '2', fontSize: 'sm', width: 'full' })} multiple>
        {sorted.map(([filepath, reportItemIdList]) => {
          const values = reportItemIdList.map(getReportItem)
          const localMaps =
            analysisData.details.byFilePathMaps[filepath as keyof typeof analysisData.details.byFilePathMaps]
          const colors = Object.entries(localMaps.colorsUsed)
          // console.log(localMaps, values)

          return (
            <AccordionItem
              key={filepath}
              value={filepath}
              className={css({
                width: 'full',
                rounded: 'md',
                bg: 'card',
                _hover: { opacity: '0.8' },
                cursor: 'pointer',
              })}
            >
              {(props) => (
                <>
                  <AccordionTrigger asChild>
                    <panda.button display="flex" bg="none" w="full" pt="6" pl="6" pr="4" cursor="pointer" color="text">
                      <panda.a
                        className={styledLink({})}
                        href={getFileLink({ filepath })}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextWithCount key={filepath} count={reportItemIdList.length}>
                          {getReportRelativeFilePath(filepath)}
                        </TextWithCount>
                      </panda.a>
                      <panda.div ml="auto" mb="4">
                        <panda.span fontWeight="bold">{values.length}</panda.span> utilities and{' '}
                        <panda.span fontWeight="bold">{Object.keys(localMaps.colorsUsed).length}</panda.span> colors
                        used
                      </panda.div>
                      <panda.span ml="2">{props.isOpen ? '▲' : '▼'}</panda.span>
                    </panda.button>
                  </AccordionTrigger>
                  <AccordionContent className={css({ p: '6', cursor: 'default' })}>
                    <panda.div>
                      <panda.h5>Utilities</panda.h5>
                      <Wrap gap="2" mt="4">
                        {values.map((reportItem) => (
                          <ReportItemLink
                            key={reportItem.id}
                            {...pick(reportItem, ['value', 'propName', 'filepath'])}
                          />
                        ))}
                      </Wrap>
                    </panda.div>

                    {colors.length ? (
                      <panda.div mt="8">
                        <panda.h5>
                          <TextWithCount count={colors.length}>Color palette</TextWithCount>
                        </panda.h5>
                        <Wrap gap="2" mt="4">
                          {colors.map(([key]) => {
                            return (
                              <ColorItem
                                tokenName={key}
                                key={key}
                                py="2"
                                px="4"
                                transition="all 0.2s ease"
                                _hover={{ bg: 'border' }}
                                rounded="md"
                              >
                                <TruncatedText text={key} />
                              </ColorItem>
                            )
                          })}
                        </Wrap>
                      </panda.div>
                    ) : null}
                  </AccordionContent>
                </>
              )}
            </AccordionItem>
          )
        })}
      </Accordion>
    </Section>
  )
}
