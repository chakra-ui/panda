import { TokenDictionary } from '@pandacss/token-dictionary'
import type { AnalysisReportJSON } from '@pandacss/types'

import { default as analysisData } from './analysis.json'

const typedData = analysisData as any as AnalysisReportJSON
export { typedData as analysisData }

export const tokenDictionary = new TokenDictionary(analysisData.theme)
