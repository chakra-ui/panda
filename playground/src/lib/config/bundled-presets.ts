import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import type { Preset } from '@pandacss/types'

// The browser can't resolve preset packages from node_modules. The built-in presets
// are bundled and resolved by name — this avoids a CDN round-trip and pins them to the
// in-repo v2 version. Unknown preset names fall back to the CDN resolver (see compile.ts).
export const bundledPresets: Record<string, Preset> = {
  '@pandacss/preset-base': presetBase,
  '@pandacss/preset-panda': presetPanda,
}
