import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import type { Preset } from '@pandacss/types'

// The browser can't resolve workspace preset packages from node_modules. Bundle
// the built-ins so playground configs stay pinned to the in-repo v2 presets.
export const bundledPresets: Record<string, Preset> = {
  '@pandacss/preset-base': presetBase,
  '@pandacss/preset-panda': presetPanda,
}
