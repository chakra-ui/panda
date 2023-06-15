import {
  Portal,
  Select,
  SelectContent,
  SelectLabel,
  SelectOption,
  SelectPositioner,
  SelectTrigger,
} from '@ark-ui/react'
import { useState } from 'react'

import { css, cx } from '../../../styled-system/css'
import { Flex, Wrap, panda } from '../../../styled-system/jsx'
import { styledLink } from '../../../styled-system/patterns'

import { analysisData } from '../../lib/analysis-data'
import { createContext } from '../../lib/create-context'
import { getFileLink, getReportRelativeFilePath, type SearchableReportItemAttributes } from '../../lib/get-report-item'
import { TokenSearchCombobox } from './token-search-combobox'
import { DataCombobox, type DataComboboxOption } from './data-combobox'
import { DataTable } from './data-table'
import { getReportInfosFrom } from './get-report-infos-from'
import { reportItemColumns } from './report-item-columns'
import { Section } from './section'
import { TextWithCount } from './text-with-count'
import { XMarkIcon } from '../icons'

export const UtilityDetails = () => {
  const search = new URLSearchParams(window.location.search)
  const initialParams = Object.fromEntries(search.entries()) as SearchableReportItemAttributes
  const [params, setParams] = useState(initialParams)
  // console.log({ params, globalMaps: analysisData.details.globalMaps })

  const infos = getReportInfosFrom(params)
  // console.log(infos)

  return (
    <panda.div>
      <panda.div display="flex">
        <panda.a href="/token-analyzer">
          <panda.span fontWeight="bold">{'<'} </panda.span>Back
        </panda.a>
        <panda.div ml="auto">
          <TokenSearchCombobox placeholder="Global search" />
        </panda.div>
      </panda.div>
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
const [DetailsProvider, useDetails] = createContext<[Infos, React.Dispatch<React.SetStateAction<Infos['params']>>]>({
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
const toOption = (value: string | object) =>
  (typeof value === 'string' ? { value, label: value } : value) as DataComboboxOption
const toFilepathOption = (filepath: string) => ({ value: filepath, label: getReportRelativeFilePath(filepath) })

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

  const allFilepath = Object.keys(analysisData.details.byFilepath).map(toFilepathOption)
  const filteredFilepath = uniq(infos.reportItemList.map((item) => item.filepath)).map(toFilepathOption)
  const filepath = filteredFilepath.length > 0 ? filteredFilepath : allFilepath

  return (
    <panda.div mb="4">
      <Flex>
        <panda.h3>Filters</panda.h3>
        {infos.hasParam && (
          <panda.button
            ml="auto"
            cursor="pointer"
            userSelect="none"
            bg="card"
            px="3"
            py="2"
            rounded="md"
            _hover={{ opacity: 0.8 }}
            onClick={() => {
              updateSearchParam('value', undefined)
              updateSearchParam('category', undefined)
              updateSearchParam('propName', undefined)
              updateSearchParam('from', undefined)
              updateSearchParam('filepath', undefined)
              setParams({})
              setResetKey((k) => k + 1)
            }}
          >
            <panda.span display="flex" gap="2" alignItems="center">
              <XMarkIcon width="16" height="16" /> Clear filters
            </panda.span>
          </panda.button>
        )}
      </Flex>
      <Wrap key={resetKey}>
        <DataCombobox
          label="Token name"
          options={tokenNames.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('value', e.value)
            return setParams((params) => ({ ...params, ['value']: e.value }))
          }}
          defaultValue={String(infos.params.value ?? '')}
        />
        <DataCombobox
          label="Property name"
          options={propertyNames.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('propName', e.value)
            return setParams((params) => ({ ...params, ['propName']: e.value }))
          }}
          defaultValue={String(infos.params.propName ?? '')}
        />
        <DataCombobox
          label="Category"
          options={categories.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('category', e.value)
            return setParams((params) => ({ ...params, ['category']: e.value }))
          }}
          defaultValue={String(infos.params.category ?? '')}
        />
        <DataCombobox
          label="Instance name (from)"
          options={from.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('from', e.value)
            return setParams((params) => ({ ...params, ['from']: e.value }))
          }}
          defaultValue={String(infos.params.from ?? '')}
        />
        <DataCombobox
          label="Filepath"
          options={filepath.map(toOption)}
          onSelect={(e) => {
            updateSearchParam('filepath', e.value)
            return setParams((params) => ({ ...params, ['filepath']: e.value }))
          }}
          defaultValue={String(infos.params.filepath ?? '')}
        />
      </Wrap>
    </panda.div>
  )
}

const UtilityDetailsContent = () => {
  const [infos] = useDetails()

  return (
    <>
      <ReportItemMatchingFiltersTable {...infos} />
      <UsedInFiles />
    </>
  )
}

const UsedInFiles = () => {
  const [infos] = useDetails()
  const files = uniq(infos.reportItemList.map((item) => item.filepath))

  return (
    <panda.div>
      <panda.h3>
        <TextWithCount count={files.length}>Used in files</TextWithCount>
      </panda.h3>
      <panda.div display="flex" flexDirection="column">
        {files.map((filepath) => (
          <panda.a
            mt="1"
            key={filepath}
            className={styledLink({})}
            href={getFileLink({ filepath })}
            onClick={(e) => e.stopPropagation()}
          >
            <TextWithCount count={infos.reportItemList.filter((item) => item.filepath === filepath).length}>
              {getReportRelativeFilePath(filepath)}
            </TextWithCount>
          </panda.a>
        ))}
      </panda.div>
    </panda.div>
  )
}

const selectOptionClass = css({
  padding: '4px 8px',
  rounded: 'md',
  '& li': {
    cursor: 'pointer',
    _hover: { opacity: 0.8 },
  },
})

const ReportItemMatchingFiltersTable = (infos: Infos) => {
  const tokenName = infos.params.value
  const defaultOption = { label: `matching search filters`, value: 'reportItemList' }
  const columns = reportItemColumns.filter((col) => (infos.params as any)[col.accessor] === undefined)

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
                  <SelectTrigger asChild>
                    <button>{selectedOption?.label}</button>
                  </SelectTrigger>
                </>
              }
              subTitle={
                <panda.span fontSize="md" fontWeight="bold" ml="auto">
                  Found ({infos[value].length}) matches{' '}
                </panda.span>
              }
              bg="card"
            >
              <DataTable list={infos[value]} columns={columns} />
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
                      {infos.params.filepath && (
                        <SelectOption
                          className={selectOptionClass}
                          value="byFilepath"
                          label={`filepath (${getReportRelativeFilePath(infos.params.filepath)})`}
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
