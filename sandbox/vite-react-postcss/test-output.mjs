import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('.', import.meta.url).pathname
const styledSystemCss = join(root, 'styled-system', 'css', 'index.mjs')
const assetsDir = join(root, 'dist', 'assets')

if (!existsSync(styledSystemCss)) {
  throw new Error('Expected PostCSS plugin to generate styled-system/css/index.mjs')
}

const cssFile = readdirSync(assetsDir).find((file) => file.endsWith('.css'))
if (!cssFile) {
  throw new Error('Expected Vite to emit a CSS asset')
}

const css = readFileSync(join(assetsDir, cssFile), 'utf8')
const expected = ['--colors-brand-500', 'background-color:var(--colors-brand-50)', 'min-height:100vh']

for (const snippet of expected) {
  if (!css.includes(snippet)) {
    throw new Error(`Expected bundled CSS to contain ${snippet}`)
  }
}
