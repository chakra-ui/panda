import type { ReportItemJSON } from '@pandacss/types'
import { css, cx } from '../../../design-system/css'
import { Grid, panda, Wrap } from '../../../design-system/jsx'
import { flex } from '../../../design-system/patterns'
import { analysisData } from '../../utils/analysis-data'

import { getReportItem, SearchableReportItemAttributes } from '../../utils/get-report-item'
import { Section } from './section'

import {
  Portal,
  Select,
  SelectContent,
  SelectLabel,
  SelectOption,
  SelectPositioner,
  SelectTrigger,
} from '@ark-ui/react'
import { createContext } from '../../hooks/create-context'
import { ReportItemOpenInEditorLink, UtilityLink } from './report-item-link'

import { Dispatch, ReactNode, SetStateAction, useState } from 'react'
import { DataCombobox } from './data-combobox'

export const UtilityDetails = () => {
  const search = new URLSearchParams(window.location.search)
  const initialParams = Object.fromEntries(search.entries()) as SearchableReportItemAttributes
  const [params, setParams] = useState(initialParams)
  // console.log({ params, globalMaps: analysisData.details.globalMaps })

  const infos = getReportInfosFrom(params)
  // console.log(infos)

  return (
    <panda.div>
      <panda.a href="/token-analyzer">
        <panda.span fontWeight="bold">{'<'} </panda.span>Back
      </panda.a>
      <panda.div p="4" mt="4">
        <DetailsProvider value={[infos, setParams]}>
          <UtilityFilters />
          <hr />
          {infos.reportItemList.length ? (
            <UtilityDetailsContent />
          ) : !infos.hasParam ? (
            <panda.div display="flex" justifyContent="center" fontSize="xl" p="16" fontWeight="bold">
              Use at least one filter
            </panda.div>
          ) : (
            <panda.div display="flex" justifyContent="center" fontSize="xl" p="16" fontWeight="bold">
              No results
            </panda.div>
          )}
        </DetailsProvider>
      </panda.div>
    </panda.div>
  )
}

type Infos = ReturnType<typeof getReportInfosFrom>
const [DetailsProvider, useDetails] = createContext<[Infos, Dispatch<SetStateAction<Infos['params']>>]>({
  name: 'UtilityDetailsContext',
})

const updateSearchParam = (key: string, value: string | undefined) => {
  const search = new URLSearchParams(window.location.search)
  if (value === undefined) {
    search.delete(key)
  } else {
    search.set(key, value)
  }
  window.history.pushState(Object.fromEntries(search.entries()), '', `${window.location.pathname}?${search.toString()}`)
}

const uniq = (arr: string[]) => Array.from(new Set(arr))
const toOption = (value: string) => ({ value, label: value })

const UtilityFilters = () => {
  const [infos, setParams] = useDetails()
  const [resetKey, setResetKey] = useState(0)

  const allTokenNames = Object.keys(analysisData.details.globalMaps.byTokenName)
  const filteredTokenNames = uniq(infos.reportItemList.map((item) => String(item.value)))
  const tokenNames = filteredTokenNames.length > 0 ? filteredTokenNames : allTokenNames

  const allCategories = Object.keys(analysisData.details.globalMaps.byCategory)
  const filteredCategories = uniq(infos.reportItemList.map((item) => item.category))
  const categories = filteredCategories.length > 0 ? filteredCategories : allCategories

  const allPropertyNames = Object.keys(analysisData.details.globalMaps.byPropertyName)
  const filteredPropertyNames = uniq(infos.reportItemList.map((item) => item.propName))
  const propertyNames = filteredPropertyNames.length > 0 ? filteredPropertyNames : allPropertyNames

  const allFrom = Object.keys(analysisData.details.globalMaps.byInstanceName)
  const filteredFrom = uniq(infos.reportItemList.map((item) => item.from))
  const from = filteredFrom.length > 0 ? filteredFrom : allFrom

  // console.log({
  //   tokenNames,
  //   categories,
  //   propertyNames,
  //   filteredTokenNames,
  //   filteredCategories,
  //   filteredPropertyNames,
  //   allTokenNames,
  //   allCategories,
  //   allPropertyNames,
  // })

  return (
    <panda.div>
      <panda.h3>Filters</panda.h3>
      <Wrap key={resetKey}>
        <DataCombobox
          label="Token name"
          // options={uniq(infos.byTokenName.map((item) => String(item.value)))}
          // options={Object.keys(analysisData.details.globalMaps.byTokenName)}
          options={tokenNames.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('value', e.value)
            return setParams((params) => ({ ...params, ['value']: e.value }))
          }}
          defaultValue={String(infos.params.value ?? '')}
        />
        <DataCombobox
          label="Property name"
          // options={uniq(infos.byPropName.map((item) => item.propName))}
          // options={Object.keys(analysisData.details.globalMaps.byPropertyName)}
          options={propertyNames.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('propName', e.value)
            return setParams((params) => ({ ...params, ['propName']: e.value }))
          }}
          defaultValue={String(infos.params.propName ?? '')}
        />
        <DataCombobox
          label="Category"
          // options={uniq(infos.byCategory.map((item) => item.category))}
          // options={Object.keys(analysisData.details.globalMaps.byCategory)}
          options={categories.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('category', e.value)
            return setParams((params) => ({ ...params, ['category']: e.value }))
          }}
          defaultValue={String(infos.params.category ?? '')}
        />
        <DataCombobox
          label="Instance name (from)"
          // options={uniq(infos.byCategory.map((item) => item.category))}
          // options={Object.keys(analysisData.details.globalMaps.byCategory)}
          options={from.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('from', e.value)
            return setParams((params) => ({ ...params, ['from']: e.value }))
          }}
          defaultValue={String(infos.params.from ?? '')}
        />
      </Wrap>
      {infos.hasParam && (
        <panda.span
          display="block"
          mt="2"
          cursor="pointer"
          userSelect="none"
          fontSize="lg"
          fontWeight="bold"
          onClick={() => {
            updateSearchParam('value', undefined)
            updateSearchParam('category', undefined)
            updateSearchParam('propName', undefined)
            updateSearchParam('from', undefined)
            setParams({})
            setResetKey((k) => k + 1)
          }}
        >
          [X] Clear filters
        </panda.span>
      )}
    </panda.div>
  )
}

const UtilityDetailsContent = () => {
  const [infos] = useDetails()
  // const reportItem = infos.reportItem!

  return (
    <>
      {/* <panda.div my="4">
        <panda.h4>Found {infos.reportItemList.length} matches</panda.h4>
        <panda.h4>Used in {'X'} files</panda.h4>
      </panda.div> */}
      {/* <panda.h4>Category : {reportItem.category}</panda.h4> */}
      {/* {reportItem.category === 'color' ? <ColorItem tokenName={String(reportItem.value)} /> : null} */}

      <ReportItemMatchingFiltersTable {...infos} />
    </>
  )
}

const selectOptionClass = css({ padding: '4px 8px', backgroundColor: 'white' })

const ReportItemMatchingFiltersTable = (infos: Infos) => {
  const tokenName = infos.params.value
  const defaultOption = { label: `matching search filters`, value: 'reportItemList' }

  return (
    <>
      <Select defaultValue={defaultOption}>
        {({ selectedOption }) => {
          const value = (selectedOption?.value ?? defaultOption.value) as keyof Omit<Infos, 'params' | 'hasParam'>
          // console.log({ value, list: infos[value] })

          return (
            <Section
              title={
                <>
                  <SelectLabel>By </SelectLabel>
                  <SelectTrigger>
                    <button>{selectedOption?.label}</button>
                  </SelectTrigger>
                </>
              }
              subTitle={
                <panda.span fontSize="md" fontWeight="bold" ml="auto">
                  Found ({infos[value].length}) matches{' '}
                </panda.span>
              }
              bg="gray.50"
            >
              <ByFiltersTable list={infos[value]} columns={allColumns} />
              <>
                <Portal>
                  <SelectPositioner>
                    <SelectContent className={cx(selectOptionClass, css({ listStyle: 'none' }))}>
                      <SelectOption
                        className={selectOptionClass}
                        value={defaultOption.value}
                        label={defaultOption.label}
                      />
                      {infos.params.value && (
                        <SelectOption
                          className={selectOptionClass}
                          label={`token name (${tokenName})`}
                          value="byTokenName"
                        />
                      )}
                      {infos.params.propName && (
                        <SelectOption
                          className={selectOptionClass}
                          value="byPropName"
                          label={`property name (${infos.params.propName})`}
                        />
                      )}
                      {infos.params.category && (
                        <SelectOption
                          className={selectOptionClass}
                          value="byCategory"
                          label={`category (${infos.params.category})`}
                        />
                      )}
                      {infos.params.from && (
                        <SelectOption
                          className={selectOptionClass}
                          value="byInstanceName"
                          label={`from (${infos.params.from})`}
                        />
                      )}
                    </SelectContent>
                  </SelectPositioner>
                </Portal>
              </>
            </Section>
          )
        }}
      </Select>
    </>
  )
}

const allColumns = [
  { header: '#', accessor: 'id' },
  { header: 'from', accessor: 'from', cell: (item: ReportItemJSON) => <UtilityLink from={item.from} /> },
  {
    header: 'category',
    accessor: 'category',
    cell: (item: ReportItemJSON) => <UtilityLink category={item.category} />,
  },
  {
    header: 'property name',
    accessor: 'propName',
    cell: (item: ReportItemJSON) => <UtilityLink propName={item.propName} />,
  },
  { header: 'token name', accessor: 'value', cell: (item: ReportItemJSON) => <UtilityLink value={item.value} /> },
  {
    header: 'filepath',
    accessor: 'filepath',
    cell: (item: ReportItemJSON) => <ReportItemOpenInEditorLink withRange {...item} />,
  },
] as const // TODO satisifes Column[]

type Column = { header: string; accessor: string; cell?: (item: ReportItemJSON) => ReactNode }

// TODO tanstack/table ? hide/show columns + sort
const ByFiltersTable = ({ list, columns }: { list: ReportItemJSON[]; columns: ReadonlyArray<Column> }) => {
  return (
    <panda.div>
      <Grid columns={6} w="full" fontWeight="bold" fontSize="lg" mb="2">
        {allColumns.map((column) => {
          return <panda.div key={column.header}>{column.header}</panda.div>
        })}
      </Grid>
      <panda.div className={flex({ direction: 'column', gap: '2' })}>
        {list.map((item) => {
          return (
            <Grid columns={6} w="full" key={item.id}>
              {columns.map((column) => {
                return (
                  <panda.div key={column.accessor}>{column.cell?.(item) ?? (item as any)[column.accessor]}</panda.div>
                )
              })}
            </Grid>
          )
        })}
      </panda.div>
    </panda.div>
  )
}

const getReportInfosFrom = (params: SearchableReportItemAttributes) => {
  let byTokenName: Array<ReportItemJSON['id']> = []
  let byCategory: Array<ReportItemJSON['id']> = []
  let byPropName: Array<ReportItemJSON['id']> = []
  let byInstanceName: Array<ReportItemJSON['id']> = []
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

  return {
    params,
    hasParam,
    byTokenName: byTokenName.map(getReportItem),
    byCategory: byCategory.map(getReportItem),
    byPropName: byPropName.map(getReportItem),
    byInstanceName: byInstanceName.map(getReportItem),
    reportItemList: combineIntersections(byTokenName, byCategory, byPropName, byInstanceName).map(getReportItem),
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
