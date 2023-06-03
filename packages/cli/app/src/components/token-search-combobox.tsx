import { analysisData } from '../utils/analysis-data'
import { getUtilityLink, getReportRelativeFilePath } from '../utils/get-report-item'
import { DataCombobox, type DataComboboxProps } from './analyzer/data-combobox'

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
  searchList.set(getReportRelativeFilePath(key), 'filepath')
})

export const TokenSearchCombobox = (props: Omit<DataComboboxProps, 'options' | 'onSelect'>) => {
  return (
    <DataCombobox
      placeholder={`Search for a token name (${tokenNames.length}), property name (${propertyNames.length}), category (${categories.length}), file path (${filepaths.length})...`}
      {...props}
      options={Array.from(searchList.entries()).map(([key, value]) => ({ label: `[${value}]: ${key}`, value: key }))}
      onSelect={(option) => {
        if (!option.value) return

        const type = searchList.get(option.value)
        if (!type) return

        window.location.href = getUtilityLink({ [type]: option.value })
      }}
    />
  )
}
