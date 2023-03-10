import { css, cx } from '../../design-system/css'
import { Grid, panda, Stack, Wrap } from '../../design-system/jsx'
import { analysisData, tokenDictionary } from '../utils/analysis-data'

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
import { gridItem } from '../../design-system/patterns/grid-item'
import { stack } from '../../design-system/patterns/stack'

import { groupIn } from '../utils/group-in'
import { getReportItemLink, getReportItem, getReportRelativeFilePath } from '../utils/get-report-item'
import { ColorItem } from './color-item'
import { ReportItemLink } from './analyzer/report-item-link'
import { TextWithCount, TruncatedText } from './analyzer/text-with-count'
import { Section } from './analyzer/section'
import { styledLink } from '../../design-system/patterns'
import { DataCombobox } from './analyzer/data-combobox'
import { pick } from '../utils/pick'

export function TokenAnalyzer() {
  console.log(tokenDictionary)
  console.log(analysisData)

  return (
    <div className={css({ width: '100%', paddingY: '20px', debug: false })}>
      <panda.div px="24" w="100%">
        <HeadlineSummary />
        <TokenSearch />
        <MostUsedList />
        <ColorPalette />
        <ByCategory />
        <FilesList />
      </panda.div>
    </div>
  )
}

const HeadlineSummary = () => {
  const [topKind, secondKind] = analysisData.stats.mostUseds.instanceOfKinds

  return (
    <Stack mb="4" direction="column" align="center" padding="20px" fontSize="lg">
      <div>
        <panda.span fontSize="xl" fontWeight="bold">
          {Object.keys(analysisData.details.byId).length}
        </panda.span>{' '}
        token usage including{' '}
        <panda.span fontSize="xl" fontWeight="bold">
          {analysisData.counts.colorsUsed}
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
                <panda.span p="2" backgroundColor="gray.100" border="1px solid rgba(0, 0, 0, 0.1)" rounded="md">
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
      <panda.div fontSize="md">
        <span>Mostly </span>
        <TextWithCount display="inline-block" count={topKind.count}>
          {topKind.key === 'function' ? 'using functions' : 'using style props'}
        </TextWithCount>
        , and others{' '}
        <TextWithCount display="inline-block" count={secondKind.count}>
          {secondKind.key === 'function' ? 'using functions' : 'using style props'}.
        </TextWithCount>
      </panda.div>
    </Stack>
  )
}

const searchList = new Map<string, string>()
const tokenNames = Object.keys(analysisData.details.globalMaps.byTokenName)
const propertyNames = Object.keys(analysisData.details.globalMaps.byPropertyName)
const categories = Object.keys(analysisData.details.globalMaps.byCategory)
const filepaths = Object.keys(analysisData.details.byFilepath)

tokenNames.sort().forEach((key) => {
  searchList.set(key, 'value')
})
propertyNames.sort().forEach((key) => {
  searchList.set(key, 'propName')
})
categories.sort().forEach((key) => {
  searchList.set(key, 'category')
})
filepaths.sort().forEach((key) => {
  searchList.set(key, 'filepath')
})

const TokenSearch = () => {
  return (
    <DataCombobox
      options={Array.from(searchList.entries()).map(([key, value]) => ({ label: `[${value}]: ${key}`, value: key }))}
      placeholder={`Search for a token name (${tokenNames.length}), property name (${propertyNames.length}), category (${categories.length}), file path (${filepaths.length})...`}
      onSelect={(option) => {
        if (!option.value) return

        const type = searchList.get(option.value)
        if (!type) return

        console.log(option, { type, value: option.value }, getReportItemLink({ [type]: option.value }))
        window.location.href = getReportItemLink({ [type]: option.value })
      }}
    />
  )
}

const selectOptionClass = css({ padding: '4px 8px', backgroundColor: 'white' })

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
            bg="gray.50"
          >
            {mostUsedByName[selectedOption?.value as keyof typeof mostUsedByName]}
            <>
              <Portal>
                <SelectPositioner>
                  <SelectContent className={cx(selectOptionClass, css({ listStyle: 'none' }))}>
                    <SelectOption className={selectOptionClass} value="tokens" label="tokens" />
                    <SelectOption className={selectOptionClass} value="properties" label="properties" />
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
          <panda.a className={styledLink({})} key={key} href={getReportItemLink({ value: key })}>
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
  instances: <MostUsedItem entries={analysisData.stats.mostUseds.instanceNames} />,
  types: <MostUsedItem entries={analysisData.stats.mostUseds.types} />,
}

const ColorPalette = () => {
  return (
    <Section
      title={<TextWithCount count={analysisData.stats.mostUseds.colors.length}>Color palette</TextWithCount>}
      bg="gray.50"
    >
      <Wrap gap="2" fontSize="sm">
        {analysisData.stats.mostUseds.colors.map(({ key, count }) => (
          <ColorItem
            tokenName={key}
            key={key}
            py="2"
            px="4"
            transition="all 0.2s ease"
            _hover={{ bgColor: 'gray.100' }}
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

const ByCategory = () => {
  const { unknown, ...rest } = analysisData.details.globalMaps.byCategory
  const keys = Object.keys(rest)

  return (
    <Section p="0" title={<TextWithCount count={keys.length + 1}>Category utilities</TextWithCount>}>
      <Grid gap="4" columns={2}>
        {/* TODO filter out variants from recipes ? */}
        {keys.map((category) => (
          <CategoryUtilities key={category} category={category} />
        ))}
        <CategoryUtilities className={gridItem({ colSpan: 2 })} category="unknown" />
      </Grid>
    </Section>
  )
}

const CategoryUtilities = ({ category, className }: { category: string; className?: string }) => {
  const reportItemIdList =
    analysisData.details.globalMaps.byCategory[category as keyof typeof analysisData.details.globalMaps.byCategory]

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

const FilesList = () => {
  const entries = Object.entries(analysisData.details.byFilepath)

  return (
    <Section p="0" title={<TextWithCount count={entries.length}>Files</TextWithCount>}>
      <Accordion className={stack({ gap: '2', px: '2', fontSize: 'sm', width: 'full', debug: false })} multiple>
        {entries.map(([filePath, reportItemIdList]) => {
          const values = reportItemIdList.map(getReportItem)
          const localMaps =
            analysisData.details.byFilePathMaps[filePath as keyof typeof analysisData.details.byFilePathMaps]
          const colors = Object.entries(localMaps.colorsUsed)
          // console.log(localMaps, values)

          return (
            <AccordionItem
              key={filePath}
              value={filePath}
              className={css({
                p: '4',
                width: 'full',
                rounded: 'md',
                _hover: { bgColor: 'gray.50' },
                cursor: 'pointer',
              })}
            >
              {(props) => (
                <>
                  <AccordionTrigger>
                    <panda.button display="flex" bg="none" w="full" p="2" cursor="pointer">
                      <panda.a
                        className={styledLink({})}
                        href={`/token-analyzer/file?path=${filePath}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextWithCount key={filePath} count={reportItemIdList.length}>
                          {getReportRelativeFilePath(filePath)}
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
                  <AccordionContent className={css({ p: '2' })}>
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
                        <panda.h5>Color palette</panda.h5>
                        <Wrap gap="2" mt="4">
                          {colors.map(([key]) => {
                            return (
                              <ColorItem
                                tokenName={key}
                                key={key}
                                py="2"
                                px="4"
                                transition="all 0.2s ease"
                                _hover={{ bgColor: 'gray.100' }}
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
