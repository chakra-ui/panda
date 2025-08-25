import { PROPERTY_TO_TOKEN_CATEGORY, DEFAULT_TOKENS } from './mappings'

export interface TokenCategories {
  colors: Record<string, string>
  spacing: Record<string, string>
  fonts: Record<string, string>
  fontSizes: Record<string, string>
  fontWeights: Record<string, string>
  lineHeights: Record<string, string>
  letterSpacings: Record<string, string>
  sizes: Record<string, string>
  shadows: Record<string, string>
  radii: Record<string, string>
  zIndex: Record<string, string>
}

export interface TokenConfig {
  prefix?: string
  tokens?: Partial<TokenCategories>
}

/**
 * Token resolver state
 */
export interface TokenResolverState {
  prefix: string
  tokens: TokenCategories
}

/**
 * Create a token resolver with the given configuration
 */
export function createTokenResolver(config: TokenConfig = {}): TokenResolverState {
  return {
    prefix: config.prefix || '',
    tokens: {
      ...(DEFAULT_TOKENS as TokenCategories),
      ...config.tokens,
    },
  }
}

/**
 * Format a token key to be CSS variable name compliant
 */
function formatCSSVariableName(key: string): string {
  // Handle pure decimal numbers (e.g., "2.5" → "2\.5")
  if (/^-?\d+\.\d+$/.test(key)) {
    return key.replace(/\./g, '\\.')
  }

  // Handle fractional values (e.g., "1/2" → "1\/2")
  if (/^\d+\/\d+$/.test(key)) {
    return key.replace(/\//g, '\\/')
  }

  // Handle nested token names (e.g., "rose.50" → "rose-50")
  return key.replace(/\./g, '-')
}

/**
 * Generate CSS custom properties from tokens
 */
export function generateCSSVariables(state: TokenResolverState): string {
  const cssVars: string[] = [':root {']

  for (const [category, tokens] of Object.entries(state.tokens)) {
    for (const [key, value] of Object.entries(tokens)) {
      const cssVariableName = formatCSSVariableName(key)
      const prefix = state.prefix ? `${state.prefix}-` : ''
      cssVars.push(`  --${prefix}${category}-${cssVariableName}: ${value};`)
    }
  }

  cssVars.push('}')
  return cssVars.join('\n')
}

/**
 * Resolve a token value to CSS variable or direct value
 */
export function resolveToken(state: TokenResolverState, property: string, value: string | number): string {
  // Handle numeric values
  if (typeof value === 'number') {
    return value.toString()
  }

  // Handle CSS keywords and units
  if (isCSSValue(value)) {
    return value
  }

  // Try to resolve from tokens
  const category = PROPERTY_TO_TOKEN_CATEGORY[property] as keyof TokenCategories
  if (category && state.tokens[category]?.[value]) {
    const cssVariableName = formatCSSVariableName(value)
    const prefix = state.prefix ? `${state.prefix}-` : ''
    return `var(--${prefix}${category}-${cssVariableName})`
  }

  // Check if it's an arbitrary value pattern
  if (isArbitraryValue(value)) {
    return parseArbitraryValue(value)
  }

  // Return as-is for unknown values
  return value
}

/**
 * Check if value is a valid CSS value
 */
function isCSSValue(value: string): boolean {
  // CSS keywords
  if (['auto', 'none', 'initial', 'inherit', 'unset', 'transparent', 'currentColor', 'current'].includes(value)) {
    return true
  }

  // CSS named colors (browsers can resolve these)
  const namedColors = [
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'cyan',
    'teal',
    'lime',
    'indigo',
    'violet',
    'fuchsia',
    'rose',
    'amber',
    'emerald',
    'sky',
    'slate',
    'gray',
    'zinc',
    'neutral',
    'stone',
    'black',
    'white',
    'darkred',
    'darkblue',
    'darkgreen',
    'lightblue',
    'lightgreen',
    'lightgray',
    'darkgray',
    'navy',
    'maroon',
    'olive',
    'aqua',
    'silver',
  ]

  if (namedColors.includes(value.toLowerCase())) {
    return true
  }

  // CSS units
  const cssUnitRegex = /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|deg|rad|turn|s|ms)$/i
  if (cssUnitRegex.test(value)) {
    return true
  }

  // Hex colors
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
    return true
  }

  // RGB/RGBA/HSL/HSLA functions
  if (/^(rgb|rgba|hsl|hsla)\([^)]+\)$/i.test(value)) {
    return true
  }

  return false
}

/**
 * Check if value is an arbitrary value (e.g., [#ff0000], [12px], etc.)
 */
function isArbitraryValue(value: string): boolean {
  return value.startsWith('[') && value.endsWith(']')
}

/**
 * Parse arbitrary value
 */
function parseArbitraryValue(value: string): string {
  return value.slice(1, -1) // Remove brackets
}

/**
 * Get all available tokens for a property
 */
export function getTokensForProperty(state: TokenResolverState, property: string): Record<string, string> | null {
  const category = PROPERTY_TO_TOKEN_CATEGORY[property] as keyof TokenCategories
  return category ? state.tokens[category] : null
}

/**
 * Add custom tokens
 */
export function addTokens(
  state: TokenResolverState,
  category: keyof TokenCategories,
  tokens: Record<string, string>,
): void {
  state.tokens[category] = { ...state.tokens[category], ...tokens }
}

// Export default instance
export const defaultTokenResolver = createTokenResolver()
