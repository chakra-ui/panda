import type { Preset } from '@pandacss/types'

import { conditions } from './conditions'
import { utilities } from './utilities'
import { patterns } from './patterns'

const definePreset = <T extends Preset>(preset: T) => preset

export const preset = definePreset({
  conditions,
  utilities,
  patterns,
})

export default preset
