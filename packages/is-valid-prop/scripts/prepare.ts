import { writeFileSync } from 'fs'
import json from 'mdn-data/css/properties.json'

const dashRegex = /-+(.)/g
function camelCaseProperty(str: string): string {
  return str.replace(dashRegex, (_, p1) => p1.toUpperCase())
}

const omitRegex = /^(?:-moz|-ms|--\*)/

const properties = Object.keys(json)
  .filter((v) => !omitRegex.test(v))
  .map((v) => camelCaseProperty(v))

const format = (code: string) => {
  const prettier = require('prettier')
  return prettier.format(code, {
    parser: 'typescript',
    singleQuote: true,
    trailingComma: 'all',
  })
}

const prefixRegex = /^([A-Z]?[a-z]{3,})[A-Z].*$/
const findPrefixes = (properties: string[], ignoredPrefixes: Set<string>) => {
  const prefixes = new Set()
  const unprefixed = new Set()

  properties.forEach((prop) => {
    const prefix = prop.match(prefixRegex)?.[1]
    if (prefix && !ignoredPrefixes.has(prefix)) {
      prefixes.add(prefix)
    } else {
      unprefixed.add(prop)
    }
  })

  return { prefixes, unprefixed }
}

const ignoredPrefixes = new Set(['max', 'min', 'page', 'will'])
const { prefixes, unprefixed } = findPrefixes(Array.from(new Set(properties)), ignoredPrefixes)

writeFileSync(
  './src/index.ts',
  format(`
  const userGeneratedStr = "";
  const userGenerated = userGeneratedStr.split(',');
  const userGeneratedPrefixes = "";

  const prefixes = "${Array.from(prefixes).join(',')}"
  const regexes = Array.from(prefixes.split(',')).concat(userGeneratedPrefixes.split(',')).map((prefix) => new RegExp('^' + prefix + '[A-Z][a-zA-Z]*'));
  const cssPropertiesStr = "${Array.from(unprefixed).join(',')}";

  const allCssProperties = cssPropertiesStr.split(',').concat(userGenerated)
  const properties = new Set(allCssProperties)

  function memo<T>(fn: (value: string) => T): (value: string) => T {
    const cache = Object.create(null)
    return (arg: string) => {
      if (cache[arg] === undefined) cache[arg] = fn(arg)
      return cache[arg]
    }
  }

  const cssPropertySelectorRegex = /&|@/

  const isCssProperty = /* @__PURE__ */ memo((prop: string) => {
    return properties.has(prop) || regexes.some((regex) => regex.test(prop)) || prop.startsWith('--') || cssPropertySelectorRegex.test(prop)
  })

  export { isCssProperty, allCssProperties }
`),
)
