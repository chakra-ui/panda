import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import { applyConfigDefaults } from '@pandacss/compiler-shared'
import { createConfigSnapshot, mergeConfigs } from '@pandacss/config'
import type { Config, UserConfig } from '@pandacss/types'
import { createCompilerFromSnapshot } from '../src'
import { importMap } from './test-utils'

/** A compiler on the default `@pandacss/preset-base` + `@pandacss/preset-panda` stack. */
export function createPresetCompiler(overrides: Partial<Config> = {}) {
  const merged = mergeConfigs([
    presetBase,
    presetPanda,
    { cwd: '/virtual', outdir: 'styled-system', importMap, ...overrides },
  ]) as UserConfig
  return createCompilerFromSnapshot(createConfigSnapshot(applyConfigDefaults(merged, '/virtual')), {
    crossFile: false,
  })
}
