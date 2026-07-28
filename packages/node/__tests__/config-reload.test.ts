import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { loadConfigAndCreateContext } from '../src/config'
import { PandaContext } from '../src/create-context'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'panda-reload-'))
  writeFileSync(
    join(dir, 'App.vue'),
    `<script setup lang="ts">
import { css } from '../styled-system/css'
const cls = css({ color: 'customColor' })
</script>
<template><div :class="cls">hi</div></template>`,
  )
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const writeConfig = (color: string) => {
  const file = join(dir, 'panda.config.ts')
  writeFileSync(
    file,
    `export default {
      cwd: ${JSON.stringify(dir)},
      include: ['*.vue'],
      outdir: 'styled-system',
      jsxFramework: 'vue',
      theme: { extend: { semanticTokens: { colors: { customColor: { value: '${color}' } } } } },
    }`,
  )
  return file
}

const extractedCssCount = (ctx: PandaContext) => ctx.parseFile(join(dir, 'App.vue'))?.css.size ?? 0

test('config reload keeps extracting styles from vue files', async () => {
  const configPath = writeConfig('green')
  const ctx = await loadConfigAndCreateContext({ cwd: dir, configPath })

  expect(extractedCssCount(ctx)).toBe(1)

  writeConfig('red')

  let reloaded: PandaContext | undefined
  const affecteds = await ctx.diff.reloadConfigAndRefreshContext((conf) => {
    reloaded = new PandaContext(conf)
  })

  expect(affecteds.hasConfigChanged).toBe(true)
  expect(reloaded).toBeDefined()
  expect(extractedCssCount(reloaded!)).toBe(1)
})
