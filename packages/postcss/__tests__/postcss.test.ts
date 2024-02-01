import { describe, expect, test } from 'vitest'
import postcss from 'postcss'
import pandacss, { PluginOptions } from '../src/index'
import { join } from 'path'
import { logger } from '@pandacss/logger'
import { rm } from 'fs/promises'
import { existsSync } from 'fs'

async function run(input: string, options: PluginOptions, from?: string) {
  const result = await postcss([pandacss(options)]).process(input, { from: from || '/foo.css' })
  return result
}

describe('PostCSS plugin', () => {
  test('skip node modules files', async () => {
    const input = '@layer reset, base, tokens, recipes, utilities;'
    const result = await run(input, {}, '/node_modules/foo.css')

    expect(result.css).toBe(input)
  })

  test('skip non-css files', async () => {
    const input = '@layer reset, base, tokens, recipes, utilities;'
    const result = await run(input, {}, '/foo.js')

    expect(result.css).toBe(input)
  })

  test('use configured log file', async () => {
    const input = '@layer reset, base, tokens, recipes, utilities;'
    const configPath = join(__dirname, 'samples', 'panda.config.cjs')
    const logFilePath = join(__dirname, 'samples', 'panda.log')

    await run(input, { logfile: logFilePath, configPath })

    logger.info('test', 'foo')

    expect(existsSync(logFilePath)).toBe(true)
    await rm(logFilePath, { force: true })
  })

  test('process correctly css file', async () => {
    const input = '@layer reset, base, tokens, recipes, utilities;'
    const configPath = join(__dirname, 'samples', 'panda.config.cjs')

    const result = await run(input, { configPath })

    expect(result.css.length).toBeGreaterThan(2)
  })

  test('register `include` as dependencies', async () => {
    const input = '@layer reset, base, tokens, recipes, utilities;'
    const configPath = join(__dirname, 'samples', 'panda.config.cjs')

    const result = await run(input, { configPath })

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'dir-dependency',
          glob: '**/*.{ts,tsx,jsx}',
          plugin: 'pandacss',
          parent: '/foo.css',
        }),
        expect.objectContaining({
          type: 'dir-dependency',
          glob: '**/*.{css,pcss}',
          plugin: 'pandacss',
          parent: '/foo.css',
        }),
      ]),
    )
  })

  test('register panda config as dependency', async () => {
    const input = '@layer reset, base, tokens, recipes, utilities;'
    const configPath = join(__dirname, 'samples', 'panda.config.cjs')

    const result = await run(input, { configPath })

    expect(result.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'dependency',
          file: expect.stringContaining('panda.config.cjs'),
          plugin: 'pandacss',
          parent: '/foo.css',
        }),
      ]),
    )
  })
})
