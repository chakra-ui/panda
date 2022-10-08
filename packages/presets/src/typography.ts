import type { TextStyles, Tokens } from '@css-panda/types'

export const fontSizes: Tokens['fontSizes'] = {
  '2xs': { value: '0.5rem' },
  xs: { value: '0.75rem' },
  sm: { value: '0.875rem' },
  md: { value: '1rem' },
  lg: { value: '1.125rem' },
  xl: { value: '1.25rem' },
  '2xl': { value: '1.5rem' },
  '3xl': { value: '1.875rem' },
  '4xl': { value: '2.25rem' },
  '5xl': { value: '3rem' },
  '6xl': { value: '3.75rem' },
  '7xl': { value: '4.5rem' },
  '8xl': { value: '6rem' },
  '9xl': { value: '8rem' },
}

export const fontWeights: Tokens['fontWeights'] = {
  thin: { value: '100' },
  extralight: { value: '200' },
  light: { value: '300' },
  normal: { value: '400' },
  medium: { value: '500' },
  semibold: { value: '600' },
  bold: { value: '700' },
  extrabold: { value: '800' },
  black: { value: '900' },
}

export const letterSpacings: Tokens['letterSpacings'] = {
  tighter: { value: '-0.05em' },
  tight: { value: '-0.025em' },
  normal: { value: '0em' },
  wide: { value: '0.025em' },
  wider: { value: '0.05em' },
  widest: { value: '0.1em' },
}

export const lineHeights: Tokens['lineHeights'] = {
  none: { value: '1' },
  tight: { value: '1.25' },
  snug: { value: '1.375' },
  normal: { value: '1.5' },
  relaxed: { value: '1.625' },
  loose: { value: '2' },
}

export const fonts: Tokens['fonts'] = {
  sans: {
    value: [
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"',
    ],
  },
  serif: {
    value: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
  },
  mono: {
    value: [
      'ui-monospace',
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace',
    ],
  },
}

export const textStyles: TextStyles = {
  xs: {
    value: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
    },
  },
  sm: {
    value: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
    },
  },
  md: {
    value: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
    },
  },
  lg: {
    value: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
    },
  },
  xl: {
    value: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
    },
  },
  '2xl': {
    value: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
    },
  },
  '3xl': {
    value: {
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
    },
  },
  '4xl': {
    value: {
      fontSize: '2.25rem',
      lineHeight: '2.5rem',
    },
  },
  '5xl': {
    value: {
      fontSize: '3rem',
      lineHeight: '1',
    },
  },
  '6xl': {
    value: {
      fontSize: '3.75rem',
      lineHeight: '1',
    },
  },
  '7xl': {
    value: {
      fontSize: '4.5rem',
      lineHeight: '1',
    },
  },
  '8xl': {
    value: {
      fontSize: '6rem',
      lineHeight: '1',
    },
  },
  '9xl': {
    value: {
      fontSize: '8rem',
      lineHeight: '1',
    },
  },
}
