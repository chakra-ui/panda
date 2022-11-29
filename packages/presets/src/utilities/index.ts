import type { UtilityConfig } from '@pandacss/types'
import { background } from './background'
import { border } from './border'
import { effects } from './effects'
import { flexGrid } from './flex-and-grid'
import { helpers } from './helpers'
import { interactivity } from './interactivity'
import { layout } from './layout'
import { list } from './list'
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
  flexGrid,
  spacing,
  sizing,
  typography,
  list,
  background,
  border,
  effects,
  tables,
  transitions,
  transforms,
  interactivity,
  svg,
  helpers,
)
