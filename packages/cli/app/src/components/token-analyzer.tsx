import type { ReportItem } from '@pandacss/types'
import type { PropsWithChildren, ReactNode } from 'react'
import { css } from '../../design-system/css'
import { Grid, panda, Stack, Wrap } from '../../design-system/jsx'
import { analysisData, tokenDictionary } from '../utils/analysis-data'
import { ColorWrapper } from './color-wrapper'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ark-ui/react'
import { gridItem } from '../../design-system/patterns/grid-item'
import { stack } from '../../design-system/patterns/stack'
import type { JsxStyleProps } from '../../design-system/types'

import { TabContent, TabList, Tabs, TabTrigger } from '@ark-ui/react'

export function TokenAnalyzer() {
  console.log(tokenDictionary)
  console.log(analysisData)

  return (
    <div className={css({ width: '100%', paddingY: '20px', debug: false })}>
      <panda.div px="24" w="100%">
        <HeadlineSummary />
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
          {analysisData.counts.propNameUsed}
        </panda.span>{' '}
        utilities and{' '}
        <panda.span fontSize="xl" fontWeight="bold">
          {analysisData.counts.colorsUsed}
        </panda.span>{' '}
        colors used in{' '}
        <panda.span fontSize="xl" fontWeight="bold">
          {analysisData.counts.filesWithTokens}
        </panda.span>{' '}
        files
      </div>
      <div>
        with{' '}
        <panda.span fontSize="xl" fontWeight="bold">
          {analysisData.fileSizes.gzip.minified}
        </panda.span>{' '}
        KB corresponding CSS generated (min+gzip)
      </div>
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

const MostUsedList = () => {
  return (
    <Tabs defaultValue="tokens">
      <TabList>
        <TabTrigger value="tokens">
          <button>Tokens</button>
        </TabTrigger>
        <TabTrigger value="properties">
          <button>Properties</button>
        </TabTrigger>
        <TabTrigger value="shorthands">
          <button>Shorthands</button>
        </TabTrigger>
        <TabTrigger value="instances">
          <button>Instances</button>
        </TabTrigger>
        <TabTrigger value="types">
          <button>Types</button>
        </TabTrigger>
      </TabList>
      <TabContent value="tokens">
        <MostUsedItem title="Top 10 tokens" entries={analysisData.stats.mostUseds.tokens} />
      </TabContent>
      <TabContent value="properties">
        <MostUsedItem title="Top 10 property" entries={analysisData.stats.mostUseds.propNames} />
      </TabContent>
      <TabContent value="shorthands">
        <MostUsedItem title="Top 10 shorthands" entries={analysisData.stats.mostUseds.shorthands} />
      </TabContent>
      <TabContent value="instances">
        <MostUsedItem title="Top 10 instances" entries={analysisData.stats.mostUseds.instanceNames} />
      </TabContent>
      <TabContent value="types">
        <MostUsedItem title="Top 10 types" entries={analysisData.stats.mostUseds.types} />
      </TabContent>
    </Tabs>
  )
}

const MostUsedItem = ({
  title,
  entries,
}: {
  title: string
  entries: Array<{
    key: string
    count: number
  }>
}) => {
  return (
    <Section title={title} bg="gray.50">
      <Wrap gap="4" fontSize="sm">
        {entries.map(({ key, count }) => {
          return (
            <TextWithCount key={key} count={count}>
              {key}
            </TextWithCount>
          )
        })}
      </Wrap>
    </Section>
  )
}

const ColorPalette = () => {
  return (
    <Section
      title={<TextWithCount count={analysisData.stats.mostUseds.colors.length}>Color palette</TextWithCount>}
      bg="gray.50"
    >
      <Wrap gap="2" fontSize="sm">
        {analysisData.stats.mostUseds.colors.map(({ key, count }) => (
          <panda.div key={key} py="2" px="4" transition="all 0.2s ease" _hover={{ bgColor: 'gray.100' }}>
            <ColorItem tokenName={key}>
              <TextWithCount count={count}>{key}</TextWithCount>
            </ColorItem>
          </panda.div>
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

const getReportItem = (id: ReportItem['id']) => {
  const reportItem = (analysisData.details.byId as Record<string, any>)[id] as ReportItem
  const propName =
    analysisData.shorthands[reportItem.attrName as keyof typeof analysisData.shorthands] ?? reportItem.attrName
  return { ...reportItem, propName }
}

const CategoryUtilities = ({ category, className }: { category: string; className?: string }) => {
  const reportItemIdList =
    analysisData.details.globalMaps.byCategory[category as keyof typeof analysisData.details.globalMaps.byCategory]

  const values = reportItemIdList.map(getReportItem)

  return (
    <panda.div key={category} p="4" bg="gray.50" className={className}>
      <TextWithCount count={reportItemIdList.length}>
        <panda.h4>{category}</panda.h4>
      </TextWithCount>
      <Wrap gap="2">
        {values.map((reportItem) => {
          // const { propName } = reportItem

          return (
            <panda.div
              key={reportItem.id}
              display="flex"
              alignItems="center"
              fontSize="sm"
              onClick={() => console.log(reportItem)}
            >
              <span>{String(reportItem.value)}</span>
              {/* TODO tooltip with propName ? */}
              {/* <Sup>({propName})</Sup> */}
            </panda.div>
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
      <Accordion className={stack({ gap: '2', px: '2', fontSize: 'sm', width: 'full', debug: true })} multiple>
        {entries.map(([filePath, reportItemIdList]) => {
          const values = reportItemIdList.map(getReportItem)
          const localMaps =
            analysisData.details.byFilePathMaps[filePath as keyof typeof analysisData.details.byFilePathMaps]
          console.log(localMaps, values)

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
                      <TextWithCount key={filePath} count={reportItemIdList.length}>
                        {filePath.replace(analysisData.cwd + '/', '')}
                      </TextWithCount>
                      <panda.div ml="auto" mb="4">
                        <panda.span fontWeight="bold">{Object.keys(localMaps.byPropertyName).length}</panda.span>{' '}
                        utilities and{' '}
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
                        {Object.entries(localMaps.byPropertyName).map(([propName, reportItemIdList]) => {
                          const values = reportItemIdList.map(getReportItem)

                          return (
                            <panda.div
                              key={propName}
                              display=""
                              alignItems="center"
                              onClick={() => console.log(values)}
                            >
                              <span>{propName}</span>
                              <Sup>({values.length})</Sup>
                            </panda.div>
                          )
                        })}
                      </Wrap>
                    </panda.div>

                    <panda.div mt="8">
                      <panda.h5>Color palette</panda.h5>
                      <Wrap gap="2" mt="4">
                        {Object.entries(localMaps.colorsUsed).map(([key, id]) => {
                          return (
                            <panda.div
                              key={key}
                              py="2"
                              px="4"
                              transition="all 0.2s ease"
                              _hover={{ bgColor: 'gray.100' }}
                              onClick={() => console.log(id.map(getReportItem))}
                            >
                              <ColorItem tokenName={key}>{key}</ColorItem>
                            </panda.div>
                          )
                        })}
                      </Wrap>
                    </panda.div>
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

const Section = ({ title, children, ...props }: PropsWithChildren<{ title: ReactNode } & JsxStyleProps>) => {
  return (
    <Stack p="4" gap="4" w="100%">
      <panda.h3>{title}</panda.h3>
      <panda.div p="4" w="100%" rounded="md" {...props}>
        {children}
      </panda.div>
    </Stack>
  )
}

const TextWithCount = ({ children, count, ...props }: PropsWithChildren<{ count: number } & JsxStyleProps>) => {
  return (
    <panda.div display="flex" alignItems="center" {...props}>
      <panda.span>{children}</panda.span>
      <Sup>({count})</Sup>
    </panda.div>
  )
}

const Sup = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <panda.sup
      fontSize="75%"
      lineHeight={0}
      position="relative"
      top="-0.35em"
      opacity="0.5"
      ml="1"
      className={className}
    >
      {children}
    </panda.sup>
  )
}

const ColorItem = ({ tokenName, children }: PropsWithChildren<{ tokenName: string }>) => {
  const token = tokenDictionary.getByName('colors.' + tokenName)
  const value = token?.value ?? tokenName

  return (
    <Stack key={tokenName}>
      <ColorWrapper
        w="auto"
        minW="80px"
        h="40px"
        mb="2"
        style={{ background: value, border: '1px solid rgba(0,0,0,0.1)' }}
      />
      {children}

      {tokenName !== value && (
        <panda.div opacity={0.1}>
          <panda.span>{value}</panda.span>
        </panda.div>
      )}
    </Stack>
  )
}
