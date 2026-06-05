import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import postcss from 'postcss'
import config from './postcss.config.mjs'

const from = join(new URL('.', import.meta.url).pathname, 'src', 'index.css')
const css = await readFile(from, 'utf8')

await postcss(config.plugins).process(css, { from })
