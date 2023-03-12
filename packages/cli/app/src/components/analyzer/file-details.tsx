import type { ReportItemJSON } from '@pandacss/types'
import { panda, Wrap } from '../../../design-system/jsx'
import { styledLink } from '../../../design-system/patterns'
import { createContext } from '../../hooks/create-context'
import { analysisData } from '../../utils/analysis-data'
import { getReportItem, getUtilityLink, getReportRelativeFilePath } from '../../utils/get-report-item'
import { ByCategory } from '../CategoryUtilities'
import { ColorItem } from '../color-item'
import { TokenSearchCombobox } from '../token-search-combobox'
import { TextWithCount } from './text-with-count'
import { TruncatedText } from './truncated-text'

export const FileDetails = () => {
  const search = new URLSearchParams(window.location.search)
  const filepath = search.get('filepath')

  const byFilepath = analysisData.details.byFilepath[filepath as keyof typeof analysisData.details.byFilepath] ?? []
  const reportItemList = byFilepath.map(getReportItem)

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
        {!filepath ? (
          <panda.div display="flex" justifyContent="center" fontSize="xl" p="16" fontWeight="bold">
            No file selected
          </panda.div>
        ) : reportItemList.length > 0 ? (
          <FileProvider value={{ filepath, localMaps: analysisData.details.byFilePathMaps[filepath], reportItemList }}>
            <FileDetailsContent />
          </FileProvider>
        ) : (
          <panda.div display="flex" justifyContent="center" fontSize="xl" p="16" fontWeight="bold">
            No results
          </panda.div>
        )}
      </panda.div>
    </panda.div>
  )
}

const [FileProvider, useFileContext] = createContext<{
  filepath: string
  localMaps: (typeof analysisData.details.byFilePathMaps)[string]
  reportItemList: Array<ReportItemJSON>
}>({
  name: 'UtilityFileContext',
})

const FileDetailsContent = () => {
  const { filepath, localMaps, reportItemList } = useFileContext()
  const colors = Object.entries(localMaps.colorsUsed)

  return (
    <>
      <panda.h3 mb="4">
        Usage in file :{' '}
        <panda.a
          mt="1"
          key={filepath}
          className={styledLink({})}
          href={getUtilityLink({ filepath })}
          onClick={(e) => e.stopPropagation()}
        >
          <TextWithCount count={reportItemList.length}>{getReportRelativeFilePath(filepath)}</TextWithCount>
        </panda.a>
      </panda.h3>
      <ByCategory byCategory={localMaps.byCategory} />
      {colors.length ? (
        <panda.div mt="8">
          <panda.h3>
            <TextWithCount count={colors.length}>Color palette</TextWithCount>
          </panda.h3>
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
    </>
  )
}
