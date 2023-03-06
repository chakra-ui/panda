import { TokenDictionary } from '@pandacss/token-dictionary'

import { default as analysisData } from './analysis.json'
export { analysisData }

export const tokenDictionary = new TokenDictionary(analysisData.theme)
