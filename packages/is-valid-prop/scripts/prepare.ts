import { writeFileSync } from 'fs'
import json from 'mdn-data/css/properties.json'

const dashRegex = /-+(.)/g
function camelCaseProperty(str: string): string {
  return str.replace(dashRegex, (_, p1) => p1.toUpperCase())
}

const omitRegex = /^(?:--\*)/

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

  const allCssProperties = [${Array.from(new Set(properties)).join(',')}, ...userGenerated]

  const properties = new Map(allCssProperties.map((prop) => [prop, true]))

  function memo<T>(fn: (value: string) => T): (value: string) => T {
    const cache = Object.create(null)
    return (arg: string) => {
      if (cache[arg] === undefined) cache[arg] = fn(arg)
      return cache[arg]
    }
  }

  const cssPropertySelectorRegex = /&|@/

  const isCssProperty = memo((prop: string) => {
    return properties.has(prop) || prop.startsWith('--') || cssPropertySelectorRegex.test(prop)
  })

  export { isCssProperty, allCssProperties }
`),
)
