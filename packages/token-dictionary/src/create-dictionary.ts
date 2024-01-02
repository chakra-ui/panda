import { getDotPath, mapToJson, memo } from '@pandacss/shared'
import { TokenDictionary as BaseDictionary, type TokenDictionaryOptions } from './dictionary'
import { formats } from './format'
import { middlewares } from './middleware'
import { transforms } from './transform'

export class TokenDictionary extends BaseDictionary {
  get: ReturnType<typeof formats.createVarGetter>
  conditionMap: ReturnType<typeof formats.groupByCondition>
  categoryMap: ReturnType<typeof formats.groupByCategory>
  values: ReturnType<typeof formats.getFlattenedValues>
  colorPalettes: ReturnType<typeof formats.groupByColorPalette>
  vars: ReturnType<typeof formats.getVars>
  json: ReturnType<typeof mapToJson>

  constructor(options: TokenDictionaryOptions) {
    super(options)
    this.registerTransform(...transforms)
    this.registerMiddleware(...middlewares)
    this.build()

    this.get = formats.createVarGetter(this)
    this.conditionMap = formats.groupByCondition(this)
    this.categoryMap = formats.groupByCategory(this)
    this.values = formats.getFlattenedValues(this)
    this.colorPalettes = mapToJson(formats.groupByColorPalette(this))
    this.vars = formats.getVars(this)
    this.json = mapToJson(this.values)
  }

  getValue = memo((path: string) => {
    const result = this.values.get(path)
    if (result != null) {
      return Object.fromEntries(result)
    }
  })

  getTokenVar = memo((path: string) => {
    return getDotPath(this.json, path)
  })
}
