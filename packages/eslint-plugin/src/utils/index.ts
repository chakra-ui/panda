import { ESLintUtils } from '@typescript-eslint/utils'
import { createSyncFn } from 'synckit'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { run } from './worker'

export const createRule: ReturnType<(typeof ESLintUtils)['RuleCreator']> = ESLintUtils.RuleCreator(
  (name) => `https://panda-css.com/docs/references/eslint#${name}`,
)

export type Rule<A extends readonly unknown[] = any, B extends string = any> = ReturnType<typeof createRule<A, B>>

export const distDir = fileURLToPath(new URL(process.env.MODE === 'test' ? '../../dist' : './', import.meta.url))

export const syncAction = createSyncFn(join(distDir, 'utils/worker.mjs')) as typeof run
