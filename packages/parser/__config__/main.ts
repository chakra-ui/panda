import { logger } from '@css-panda/logger'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { minifyConfig } from '..'

const dir = resolve(__dirname, './input')
const filter = ['v2.js']

const files = readdirSync(dir).filter((file) => filter.includes(file))

for (const file of files) {
  const filepath = join(dir, file)
  logger.info(`Minifying ${filepath}`)

  const input = readFileSync(filepath, 'utf-8')
  const code = minifyConfig(input)
  const output = filepath.replace('input', 'output')

  writeFileSync(output, code)

  logger.info(`Minified ✅: \n${filepath}`)
}
