import type { Preset } from '@pandacss/types'
import { conditions } from './conditions'
import { patterns } from './patterns'
import { utilities } from './utilities'

const definePreset = <T extends Preset>(preset: T) => preset

export const preset = definePreset({
  name: '@pandacss/preset-base',
  conditions,
  utilities,
  patterns,
})

export default preset
