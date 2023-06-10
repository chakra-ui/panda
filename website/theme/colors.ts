import { defineTokens } from '@pandacss/dev'

const makePrimaryColor = (l: number) => {
  return {
    value: `hsl(var(--nextra-primary-hue) 100% ${l}%)`
  }
}

export const colors = defineTokens.colors({
  current: { value: 'currentColor' },
  dark: { value: '#111' },
  black: { value: '#000' },
  white: { value: '#fff' },
  primary: {
    50: makePrimaryColor(97),
    100: makePrimaryColor(94),
    200: makePrimaryColor(86),
    300: makePrimaryColor(77),
    400: makePrimaryColor(66),
    500: makePrimaryColor(50),
    600: makePrimaryColor(45),
    700: makePrimaryColor(39),
    750: makePrimaryColor(35),
    800: makePrimaryColor(32),
    900: makePrimaryColor(24)
  } as any,
  slate: {
    50: { value: '#f8fafc' },
    100: { value: '#f1f5f9' },
    200: { value: '#e2e8f0' },
    300: { value: '#cbd5e1' },
    400: { value: '#94a3b8' },
    500: { value: '#64748b' },
    600: { value: '#475569' },
    700: { value: '#334155' },
    800: { value: '#1e293b' },
    900: { value: '#0f172a' },
    950: { value: '#020617' }
  },
  gray: {
    50: { value: '#f9fafb' },
    100: { value: '#f3f4f6' },
    200: { value: '#e5e7eb' },
    300: { value: '#d1d5db' },
    400: { value: '#9ca3af' },
    500: { value: '#6b7280' },
    600: { value: '#4b5563' },
    700: { value: '#374151' },
    800: { value: '#1f2937' },
    900: { value: '#111827' },
    950: { value: '#030712' }
  },
  neutral: {
    50: { value: '#fafafa' },
    100: { value: '#f5f5f5' },
    200: { value: '#e5e5e5' },
    300: { value: '#d4d4d4' },
    400: { value: '#a3a3a3' },
    500: { value: '#737373' },
    600: { value: '#525252' },
    700: { value: '#404040' },
    800: { value: '#262626' },
    900: { value: '#171717' },
    950: { value: '#0a0a0a' }
  },
  red: {
    50: { value: '#fef2f2' },
    100: { value: '#fee2e2' },
    200: { value: '#fecaca' },
    300: { value: '#fca5a5' },
    400: { value: '#f87171' },
    500: { value: '#ef4444' },
    600: { value: '#dc2626' },
    700: { value: '#b91c1c' },
    800: { value: '#991b1b' },
    900: { value: '#7f1d1d' },
    950: { value: '#450a0a' }
  },
  orange: {
    50: { value: '#fff7ed' },
    100: { value: '#ffedd5' },
    200: { value: '#fed7aa' },
    300: { value: '#fdba74' },
    400: { value: '#fb923c' },
    500: { value: '#f97316' },
    600: { value: '#ea580c' },
    700: { value: '#c2410c' },
    800: { value: '#9a3412' },
    900: { value: '#7c2d12' },
    950: { value: '#431407' }
  },
  yellow: {
    50: { value: '#fefce8' },
    100: { value: '#fef9c3' },
    200: { value: '#fef08a' },
    300: { value: '#fde047' },
    400: { value: '#facc15' },
    500: { value: '#eab308' },
    600: { value: '#ca8a04' },
    700: { value: '#a16207' },
    800: { value: '#854d0e' },
    900: { value: '#713f12' },
    950: { value: '#422006' }
  },
  blue: {
    50: { value: '#eff6ff' },
    100: { value: '#dbeafe' },
    200: { value: '#bfdbfe' },
    300: { value: '#93c5fd' },
    400: { value: '#60a5fa' },
    500: { value: '#3b82f6' },
    600: { value: '#2563eb' },
    700: { value: '#1d4ed8' },
    800: { value: '#1e40af' },
    900: { value: '#1e3a8a' },
    950: { value: '#172554' }
  },
  blackAlpha: {
    50: { value: 'rgba(0, 0, 0, 0.04)' },
    100: { value: 'rgba(0, 0, 0, 0.06)' },
    200: { value: 'rgba(0, 0, 0, 0.08)' },
    300: { value: 'rgba(0, 0, 0, 0.16)' },
    400: { value: 'rgba(0, 0, 0, 0.24)' },
    500: { value: 'rgba(0, 0, 0, 0.36)' },
    600: { value: 'rgba(0, 0, 0, 0.48)' },
    700: { value: 'rgba(0, 0, 0, 0.64)' },
    800: { value: 'rgba(0, 0, 0, 0.80)' },
    900: { value: 'rgba(0, 0, 0, 0.92)' }
  },
  whiteAlpha: {
    50: { value: 'rgba(255, 255, 255, 0.04)' },
    100: { value: 'rgba(255, 255, 255, 0.06)' },
    200: { value: 'rgba(255, 255, 255, 0.08)' },
    300: { value: 'rgba(255, 255, 255, 0.16)' },
    400: { value: 'rgba(255, 255, 255, 0.24)' },
    500: { value: 'rgba(255, 255, 255, 0.36)' },
    600: { value: 'rgba(255, 255, 255, 0.48)' },
    700: { value: 'rgba(255, 255, 255, 0.64)' },
    800: { value: 'rgba(255, 255, 255, 0.80)' },
    900: { value: 'rgba(255, 255, 255, 0.92)' }
  },
})
