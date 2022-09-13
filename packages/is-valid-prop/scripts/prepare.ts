import { camelCaseProperty } from 'css-in-js-utils'
import { writeFileSync } from 'fs'
import json from 'mdn-data/css/properties.json'
import outdent from 'outdent'

const properties = Object.keys(json)
  .filter((v) => v !== '--*')
  .map((v) => JSON.stringify(camelCaseProperty(v)))

writeFileSync(
  './src/index.ts',
  outdent`
  function memo<T>(fn: (value: string) => T): (value: string) => T {
    const cache = Object.create(null)
    return (arg: string) => {
      if (cache[arg] === undefined) cache[arg] = fn(arg)
      return cache[arg]
    }
  }

  const properties = [${Array.from(new Set(properties)).join(',')}]
  const regex = new RegExp('^(?:' + Array.from(properties).join('|') + ')$')
   
  export const isCssProperty = memo((prop: string) => {
    return regex.test(prop)
  })
`,
)
