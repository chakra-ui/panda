import { readFileSync } from 'fs'
import { resolve } from 'path'
import { extractPatterns } from '../src/extract-pattern'

const filepath = resolve(__dirname, './output/v1.js')
const input = readFileSync(filepath, 'utf-8')

const code = extractPatterns(input)
console.log(code)
