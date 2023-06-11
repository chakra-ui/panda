import type { TextStyles, Tokens } from '@pandacss/types'

export const fontSizes: Tokens['fontSizes'] = {
  '050': { value: '0.6875rem' },
  '075': { value: '0.75rem' },
  '100': { value: '0.875rem' },
  '200': { value: '1rem' },
  '300': { value: '1.25rem' },
  '400': { value: '1.5rem' },
  '500': { value: '1.8125rem' },
  '600': { value: '2.1875rem' },
}

export const fontWeights: Tokens['fontWeights'] = {
  bold: { value: '700' },
  medium: { value: '500' },
  regular: { value: '400' },
  semibold: { value: '600' },
}

export const lineHeights: Tokens['lineHeights'] = {
  '100': { value: '1rem' },
  '200': { value: '1.25rem' },
  '300': { value: '1.5rem' },
  '400': { value: '1.75rem' },
  '500': { value: '2rem' },
  '600': { value: '2.5rem' },
}

export const letterSpacings: Tokens['letterSpacings'] = {
  '050': {
    value: '-0.01em',
  },
  '100': {
    value: '-0.008em',
  },
  '200': {
    value: '-0.006em',
  },
  '300': {
    value: '-0.004em',
  },
  '400': {
    value: '-0.002em',
  },
  '500': {
    value: '0em',
  },
  '600': {
    value: '0.002em',
  },
}

export const fonts: Tokens['fonts'] = {
  monospace: {
    value:
      '"SFMono-Medium", "SF Mono", "Segoe UI Mono", "Roboto Mono", "Ubuntu Mono", Menlo, Consolas, Courier, monospace',
  },
  sans: {
    value:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
}

export const textStyles: TextStyles = {
  '050': {
    value: {
      fontSize: '050',
    },
  },
  '100': {
    value: {
      fontSize: '100',
      lineHeight: '100',
    },
  },
  '200': {
    value: {
      fontSize: '200',
      lineHeight: '200',
    },
  },
  '300': {
    value: {
      fontSize: '300',
      lineHeight: '300',
    },
  },
  '400': {
    value: {
      fontSize: '400',
      lineHeight: '400',
    },
  },
  '500': {
    value: {
      fontSize: '500',
      lineHeight: '500',
    },
  },
  '600': {
    value: {
      fontSize: '600',
      lineHeight: '600',
    },
  },
}
