export const importMap = {
  css: ['@panda/css'],
  recipe: ['@panda/recipes'],
  pattern: ['@panda/patterns'],
  jsx: ['@panda/jsx'],
  tokens: ['@panda/tokens'],
}

export const LAYERS = ['reset', 'base', 'tokens', 'recipes', 'utilities'] as const

export const DEFAULT_FILES = 100
export const DEFAULT_RUNS = 7

export const HUE_RANGE = 360
export const GAP_MIN = 2
export const GAP_VARIANTS = 8
export const ICON_GAP = 8

export const EM_STEP = 0.25
export const CONTAINER_BASE_REM = 20
export const CONTAINER_STEP_REM = 4

export const SPACING_VALUES = 133

export const SPACING_PROPERTIES = [
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingX',
  'paddingY',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginX',
  'marginY',
]

export const CONTAINERS = 14
