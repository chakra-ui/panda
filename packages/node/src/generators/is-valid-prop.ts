import { readFileSync } from 'fs'
import type { PandaContext } from '../context'
import { getEntrypoint } from './get-entrypoint'

export function generateisValidProp(ctx: PandaContext) {
  const filePath = getEntrypoint('@pandacss/is-valid-prop', { dev: 'index.ts', prod: 'index.mjs' })

  let content = readFileSync(filePath, 'utf8')
  content = content.replace(
    'var userGenerated = []',
    `var userGenerated = [${ctx.properties.map((key) => JSON.stringify(key)).join(',')}]`,
  )

  return {
    js: content,
  }
}
