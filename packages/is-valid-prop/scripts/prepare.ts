import { camelCaseProperty } from 'css-in-js-utils'
import { writeFileSync } from 'fs'
import json from 'mdn-data/css/properties.json'

const omitRegex = /^(?:--\*|-ms|-moz|-webkit)/

const properties = Object.keys(json)
  .filter((v) => !omitRegex.test(v))
  .map((v) => JSON.stringify(camelCaseProperty(v)))

const format = (code: string) => {
  const prettier = require('prettier')
  return prettier.format(code, {
    parser: 'typescript',
    singleQuote: true,
    trailingComma: 'all',
  })
}

writeFileSync(
  './src/index.ts',
  format(`
  const userGenerated: string[] = []

  const uniq = (arr: string[]) => Array.from(new Set(arr))

  const allCssProperties = uniq([${Array.from(new Set(properties)).join(',')}, ...userGenerated])
  
  const regex = new RegExp('^(?:' + Array.from(allCssProperties).join('|') + ')$')

  function memo<T>(fn: (value: string) => T): (value: string) => T {
    const cache = Object.create(null)
    return (arg: string) => {
      if (cache[arg] === undefined) cache[arg] = fn(arg)
      return cache[arg]
    }
  }
   
  const isCssProperty = memo((prop: string) => {
    return regex.test(prop)
  })

  export { isCssProperty, allCssProperties }
`),
)
