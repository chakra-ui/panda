import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import { afterAll, describe, it } from 'vitest'
import { createPandaPlugin } from '../src'

// RuleTester registers its cases through these static hooks; point them at vitest.
const hooks = RuleTester as unknown as {
  afterAll: typeof afterAll
  describe: typeof describe
  it: typeof it
  itOnly: typeof it.only
}
hooks.afterAll = afterAll
hooks.describe = describe
hooks.it = it
hooks.itOnly = it.only

type RuleDefinition = Parameters<RuleTester['run']>[1]
type RuleTests = Parameters<RuleTester['run']>[2]

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

/** Writes `pandaConfig` as `panda.config.ts` in a temp project and lints against it. */
export async function createPandaRuleTester(pandaConfig: string) {
  const dir = mkdtempSync(join(tmpdir(), 'panda-eslint-'))
  writeFileSync(join(dir, 'panda.config.ts'), pandaConfig)
  const plugin = await createPandaPlugin({ cwd: dir })

  return {
    dir,
    run(ruleName: string, tests: RuleTests) {
      ruleTester.run(ruleName, plugin.rules[ruleName] as unknown as RuleDefinition, tests)
    },
  }
}

export const withCss = (...lines: string[]) => ["import { css } from '@panda/css'", ...lines].join('\n')
