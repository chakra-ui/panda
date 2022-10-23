import { TokenDictionary, TokenDictionaryOptions } from './dictionary'
import { createVarGetter, getFlattenedValues, groupByCategory, groupByCondition } from './format'
import { transforms } from './transform'

export function createTokenDictionary(values: TokenDictionaryOptions) {
  const dictionary = new TokenDictionary(values)
  dictionary.registerTransform(...transforms)
  dictionary.build()
  return {
    value: dictionary,
    getTokenVar: createVarGetter(dictionary),
    conditionMap: () => groupByCondition(dictionary),
    categoryMap: () => groupByCategory(dictionary),
    flatValues: () => getFlattenedValues(dictionary),
  }
}
