import { readFileSync, writeFileSync } from 'fs'

let dts = readFileSync('node_modules/csstype/index.d.ts', { encoding: 'utf8' })
dts = dts
  .replaceAll('string & {}', 'string & { __type?: never }')
  .replaceAll('number & {}', 'number & { __type?: never }')

writeFileSync('src/csstype.d.ts', dts)
