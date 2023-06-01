export interface PandaVSCodeSettings {
  'color-hints.enabled'?: boolean
  'color-hints.semantic-tokens.enabled'?: boolean
  'rem-to-px.enabled'?: boolean
  'completions.enabled'?: boolean
  'completions.token-fn.enabled'?: boolean
  'diagnostics.enabled'?: boolean
  'diagnostics.invalid-token-path'?: 'disable' | 'hint' | 'information' | 'warning' | 'error'
  'hovers.enabled'?: boolean
  'hovers.instances.enabled'?: boolean
  'hovers.tokens.enabled'?: boolean
  'hovers.conditions.enabled'?: boolean
  'hovers.semantic-colors.enabled'?: boolean
  'hovers.display.mode'?: 'nested' | 'optimized' | 'minified'
  'hovers.display.force-hash'?: boolean
  'inlay-hints.enabled'?: boolean
  'debug.enabled'?: boolean
}

export const defaultSettings: PandaVSCodeSettings = {
  'debug.enabled': false,
  'diagnostics.invalid-token-path': 'warning',
}
