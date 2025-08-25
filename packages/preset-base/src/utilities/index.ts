import type { UtilityConfig } from '@pandacss/types'
import { background } from './background'
import { border } from './border'
import { container } from './container'
import { cursor } from './cursor'
import { display } from './display'
import { divide } from './divide'
import { effects } from './effects'
import { flexGrid } from './flex-and-grid'
import { focusRing } from './focus-ring'
import { backgroundGradients } from './gradient'
import { helpers } from './helpers'
import { interactivity } from './interactivity'
import { layout } from './layout'
import { list } from './list'
import { outline } from './outline'
import { polyfill } from './polyfill'
import { sizing } from './sizing'
import { spacing } from './spacing'
import { svg } from './svg'
import { tables } from './tables'
import { transforms } from './transforms'
import { transitions } from './transitions'
import { typography } from './typography'

export const utilities: UtilityConfig = Object.assign(
  {},
  layout,
  display,
  flexGrid,
  spacing,
  outline,
  focusRing,
  divide,
  sizing,
  typography,
  list,
  background,
  backgroundGradients,
  border,
  effects,
  tables,
  transitions,
  transforms,
  interactivity,
  svg,
  helpers,
  polyfill,
  container,
  cursor,
)
