import { preset as presetBase } from '@pandacss/preset-base'
import { preset as presetPanda } from '@pandacss/preset-panda'

const bundledPresets = {
  '@pandacss/preset-base': presetBase,
  '@pandacss/preset-panda': presetPanda,
  '@pandacss/dev/presets': presetPanda,
}

const bundledPresetsNames = Object.keys(bundledPresets)

export const isBundledPreset = (preset: string): preset is keyof typeof bundledPresets =>
  bundledPresetsNames.includes(preset)

export const getBundledPreset = (preset: unknown) => {
  return typeof preset === 'string' && isBundledPreset(preset) ? bundledPresets[preset] : undefined
}

export { presetBase, presetPanda }
