import { TokenDictionary } from '@pandacss/token-dictionary'
import type { AnalysisReportJSON } from '@pandacss/types'

//@ts-ignore
import analysisData from './analysis.json' assert { type: 'json' }

const typedData = analysisData as any as AnalysisReportJSON
export { typedData as analysisData }

export const tokenDictionary = new TokenDictionary(analysisData.theme)

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.PANDA_TOKEN_DICTIONNARY = tokenDictionary
  // @ts-ignore
  window.PANDA_ANALYSIS_DATA = analysisData
}
