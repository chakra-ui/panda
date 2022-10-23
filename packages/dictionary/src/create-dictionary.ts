import { TokenDictionary, TokenDictionaryOptions } from './dictionary'
import { formats } from './format'
import { transforms } from './transform'

export function createTokenDictionary(values: TokenDictionaryOptions) {
  const dictionary = new TokenDictionary(values)
  dictionary.registerTransform(...transforms)
  dictionary.build()
  return Object.assign(dictionary, {
    value: dictionary,
    getTokenVar: formats.createVarGetter(dictionary),
    conditionMap: () => formats.groupByCondition(dictionary),
    categoryMap: () => formats.groupByCategory(dictionary),
    flatValues: () => formats.getFlattenedValues(dictionary),
  })
}
