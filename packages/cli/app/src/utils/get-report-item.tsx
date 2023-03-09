import type { ReportItemJSON } from '@pandacss/types'
import { analysisData } from './analysis-data'
import { pick } from './pick'

export const getReportItem = (id: ReportItemJSON['id']) =>
  (analysisData.details.byId as Record<string, any>)[id] as ReportItemJSON

export type SearchableReportItemAttributes = Partial<
  Pick<ReportItemJSON, 'value' | 'category' | 'propName' | 'filepath' | 'from'>
>

export const getReportItemLink = (reportItem: SearchableReportItemAttributes) => {
  const searchParams = new URLSearchParams(
    pick(reportItem, ['value', 'category', 'propName', 'from', 'filepath']) as any,
  )
  return `/token-analyzer/utility?${searchParams.toString()}`
}

export const getReportItemFromTokenName = (tokenName: string) => {
  const reportItem = analysisData.details.globalMaps.byTokenName[tokenName]?.[0]
  return getReportItem(reportItem)
}

export const getReportRelativeFilePath = (filePath: string) => filePath.replace(analysisData.cwd + '/', '')
export const getReportRange = (reportItem: ReportItemJSON) =>
  `:${reportItem.box.node.range.startLineNumber}:${reportItem.box.node.range.startColumn}`

const openInEditor = (filepath: string, line: number, column: number) => {
  // const url = new URL('vscode://file' + filepath)
  // url.searchParams.set('line', line.toString())
  // window.open(url.toString())

  // return fetch(`/__open-in-editor?file=${encodeURIComponent(`${filepath}:${line}:${column}`)}`)
  return fetch(`/__open-in-editor?file=${encodeURIComponent(`${filepath}:${line}:${column}`)}`)
}

export const openReportItemInEditor = (reportItem: ReportItemJSON) => {
  console.log(reportItem)
  return openInEditor(
    reportItem.filepath,
    reportItem.box.node.range.startLineNumber,
    reportItem.box.node.range.startColumn,
  )
}
