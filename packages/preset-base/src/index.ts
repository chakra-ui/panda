import type { Preset } from '@pandacss/types'

import { conditions } from './conditions'
import { utilities } from './utilities'
import { patterns } from './patterns'

export const preset: Preset = {
  conditions,
  utilities,
  patterns,
}

export default preset
