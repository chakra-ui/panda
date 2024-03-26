import type { Preset } from '@pandacss/types'
import { conditions } from './conditions'
import { globalCss } from './global-css'
// import { globalVars } from './global-vars'
import { patterns } from './patterns'
import { utilities } from './utilities'

const definePreset = <T extends Preset>(preset: T) => preset

export const preset = definePreset({
  conditions,
  utilities,
  patterns,
  // globalVars,
  globalCss,
})

export default preset
