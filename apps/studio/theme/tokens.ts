import { defineSemanticTokens, defineTokens } from '@pandacss/dev'

export const tokens = defineTokens({
  fonts: {
    display: { value: "'Onest', system-ui, -apple-system, sans-serif" },
    body: { value: "'Onest', system-ui, -apple-system, sans-serif" },
    mono: { value: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace" },
  },
})

export const semanticTokens = defineSemanticTokens({
  colors: {
    sunken: { value: { base: '#f6f6f6', _dark: '#000000' } },
    canvas: { value: { base: '#fcfcfc', _dark: '#111111' } },
    paper: { value: { base: '#ffffff', _dark: '#181818' } },
    ink: { value: { base: 'rgba(0,0,0,0.875)', _dark: 'rgba(255,255,255,0.93)' } },
    muted: { value: { base: 'rgba(0,0,0,0.608)', _dark: 'rgba(255,255,255,0.686)' } },
    faint: { value: { base: 'rgba(0,0,0,0.42)', _dark: 'rgba(255,255,255,0.44)' } },
    subtle: { value: { base: 'rgba(0,0,0,0.04)', _dark: 'rgba(255,255,255,0.06)' } },
    selected: { value: { base: 'rgba(0,0,0,0.06)', _dark: 'rgba(255,255,255,0.1)' } },
    line: { value: { base: 'rgba(0,0,0,0.07)', _dark: 'rgba(255,255,255,0.08)' } },
    divider: { value: { base: '#ededed', _dark: '#262626' } },
    lineStrong: { value: { base: 'rgba(0,0,0,0.12)', _dark: 'rgba(255,255,255,0.14)' } },
    solid: { value: { base: '#171717', _dark: '#ededed' } },
    onSolid: { value: { base: '#ffffff', _dark: '#0a0a0a' } },
    accent: { value: '#f6e458' },
    accentHover: { value: '#efd93a' },
    ring: { value: { base: '#dcc11a', _dark: '#f6e458' } },
    accentSubtle: { value: { base: 'rgba(246,228,88,0.55)', _dark: 'rgba(246,228,88,0.28)' } },
    onAccent: { value: '#1a1a1a' },
    success: { value: { base: '#15864a', _dark: '#2fbd6e' } },
    danger: { value: { base: '#c0362c', _dark: '#f0554b' } },
    dangerSubtle: { value: { base: 'rgba(192,54,44,0.07)', _dark: 'rgba(240,85,75,0.1)' } },
    warningSubtle: { value: { base: 'rgba(233,172,60,0.1)', _dark: 'rgba(233,172,60,0.12)' } },
  },
  shadows: {
    button: {
      value: {
        base: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05), inset 0 -1px 0 rgba(0,0,0,0.05)',
        _dark: '0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
    buttonPrimary: {
      value:
        '0 0 0 1px rgba(120,100,0,0.35), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.08)',
    },
    inset: {
      value: {
        base: '0 0 0 1px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.05)',
        _dark: '0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 2px rgba(0,0,0,0.4)',
      },
    },
    focusHalo: {
      value: {
        base: '0 0 0 1px rgba(0,0,0,0.4), 0 0 0 4px rgba(246,228,88,0.55)',
        _dark: '0 0 0 1px rgba(255,255,255,0.45), 0 0 0 4px rgba(246,228,88,0.3)',
      },
    },
    raised: {
      value: {
        base: '0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 1px -1px rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.05)',
        _dark: 'inset 0 0 0 0.5px rgba(255,255,255,0.08)',
      },
    },
    overlay: {
      value: {
        base: '0 0 0 0.5px rgba(0,0,0,0.06), 0 8px 40px 0 rgba(0,0,0,0.05), 0 12px 32px -16px rgba(0,0,0,0.15)',
        _dark: 'inset 0 0 0 0.5px rgba(255,255,255,0.1), 0 16px 40px -12px rgba(0,0,0,0.7)',
      },
    },
  },
})
