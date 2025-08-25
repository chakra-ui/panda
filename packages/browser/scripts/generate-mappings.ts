#!/usr/bin/env tsx
/**
 * Script to automatically generate Panda CSS utility mappings
 * Based on preset-base and preset-panda exported configurations
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import pandaPreset from '@pandacss/preset-panda'
import basePreset from '@pandacss/preset-base'

interface ParseResult {
  utilityMap: Map<string, string>
  shorthandMap: Map<string, string>
}

function parseUtilities(utilities: Record<string, any>): ParseResult {
  console.log('🔍 Parsing utilities from preset...')

  const utilityMap = new Map<string, string>()
  const shorthandMap = new Map<string, string>()

  for (const [property, config] of Object.entries(utilities)) {
    if (config && typeof config === 'object') {
      // Extract className
      if (config.className && typeof config.className === 'string') {
        utilityMap.set(config.className, property)
      }

      // Extract shorthands
      if (config.shorthand) {
        if (Array.isArray(config.shorthand)) {
          for (const shorthand of config.shorthand) {
            if (typeof shorthand === 'string') {
              shorthandMap.set(shorthand, property)
            }
          }
        } else if (typeof config.shorthand === 'string') {
          shorthandMap.set(config.shorthand, property)
        }
      }
    }
  }

  console.log(`   ✅ Found ${utilityMap.size} utilities and ${shorthandMap.size} shorthands`)
  return { utilityMap, shorthandMap }
}

function parseConditions(conditions: Record<string, any>): Map<string, string> {
  console.log('🎯 Parsing conditions from preset...')

  const conditionMap = new Map<string, string>()

  for (const [conditionName] of Object.entries(conditions)) {
    // Convert to Panda CSS condition format
    const pandaCondition = conditionName.startsWith('_') ? conditionName : `_${conditionName}`
    conditionMap.set(conditionName, pandaCondition)
  }

  // Add base breakpoint (always present)
  conditionMap.set('base', 'base')

  console.log(`   ✅ Found ${conditionMap.size} conditions`)
  return conditionMap
}

function generateMappingFile(
  utilityMap: Map<string, string>,
  shorthandMap: Map<string, string>,
  conditionMap: Map<string, string>,
  breakpoints: Record<string, string>,
  conditions: Record<string, string>,
  propertyToTokenCategory: Record<string, string>,
  defaultTokens: Record<string, Record<string, string>>,
): string {
  const timestamp = new Date().toISOString()

  const template = `/**
 * Complete utility mapping from class name prefixes to CSS properties
 * Based on Panda CSS preset-base and preset-panda configurations
 *
 * @generated This file is auto-generated. Do not edit manually.
 * Run \`npm run generate-mappings\` to regenerate.
 * Generated on: ${timestamp}
 */

export const CLASS_TO_PROPERTY_MAP = new Map([
${Array.from(utilityMap.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([className, property]) => `  ['${className}', '${property}'],`)
  .join('\n')}
])

/**
 * Shorthand property aliases
 */
export const SHORTHAND_ALIASES = new Map([
${Array.from(shorthandMap.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([shorthand, property]) => `  ['${shorthand}', '${property}'],`)
  .join('\n')}
])

/**
 * Breakpoints and condition mapping
 */
export const CONDITION_MAP = new Map([
${Array.from(conditionMap.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([condition, pandaCondition]) => `  ['${condition}', '${pandaCondition}'],`)
  .join('\n')}
])

/**
 * Property to token category mapping
 * Based on Panda CSS preset-panda theme configuration
 */
export const PROPERTY_TO_TOKEN_CATEGORY: Record<string, string> = {
${Object.entries(propertyToTokenCategory)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([property, category]) => `  ${property}: '${category}',`)
  .join('\n')}
}

/**
 * Default breakpoints from Panda CSS preset
 */
export const DEFAULT_BREAKPOINTS = ${JSON.stringify(breakpoints, null, 2)} as const

/**
 * Default conditions from Panda CSS preset
 */
export const DEFAULT_CONDITIONS = ${JSON.stringify(conditions, null, 2)} as const

/**
 * Default tokens from Panda CSS preset
 */
export const DEFAULT_TOKENS = ${JSON.stringify(defaultTokens, null, 2)} as const
`

  return template
}

function extractBreakpoints(preset: any): Record<string, string> {
  const breakpoints: Record<string, string> = {}

  if (preset.theme?.breakpoints) {
    for (const [name, value] of Object.entries(preset.theme.breakpoints)) {
      if (typeof value === 'string') {
        breakpoints[name] = value
      }
    }
  }

  return breakpoints
}

function extractConditions(preset: any): Record<string, string> {
  const conditions: Record<string, string> = {}

  if (preset.conditions) {
    for (const [name, value] of Object.entries(preset.conditions)) {
      if (typeof value === 'string') {
        conditions[name] = value
      }
    }
  }

  return conditions
}

function generatePropertyToTokenCategory(pandaPreset: any, basePreset: any): Record<string, string> {
  console.log('🔗 Analyzing property to token category relationships...')

  const propertyToTokenCategory: Record<string, string> = {}

  // Get theme tokens from panda preset
  const theme = pandaPreset.theme || {}
  const tokenCategories = Object.keys(theme)

  console.log(`   📋 Found token categories: ${tokenCategories.join(', ')}`)

  // Analyze utilities from base preset to find token references
  const utilities = basePreset.utilities || {}

  for (const [property, config] of Object.entries(utilities)) {
    if (config && typeof config === 'object' && 'values' in config && config.values) {
      // Check if values reference theme tokens
      const values = config.values

      if (typeof values === 'string') {
        // Direct token reference like "theme.colors"
        const tokenRef = parseTokenReference(values)
        if (tokenRef && tokenCategories.includes(tokenRef)) {
          propertyToTokenCategory[property] = tokenRef
        }
      } else if (typeof values === 'object' && values !== null && 'type' in values && values.type === 'token') {
        // Token type reference
        if ('value' in values && typeof values.value === 'string') {
          const tokenRef = parseTokenReference(values.value)
          if (tokenRef && tokenCategories.includes(tokenRef)) {
            propertyToTokenCategory[property] = tokenRef
          }
        }
      }

      // Also check for common property patterns
      const commonMappings = getCommonPropertyMappings()
      if (commonMappings[property]) {
        propertyToTokenCategory[property] = commonMappings[property]
      }
    }
  }

  console.log(`   ✅ Generated ${Object.keys(propertyToTokenCategory).length} property-to-token mappings`)
  return propertyToTokenCategory
}

function parseTokenReference(ref: string): string | null {
  // Handle references like "theme.colors", "{theme.spacing}", etc.
  const match = ref.match(/(?:theme|token)\.([a-zA-Z0-9]+)/i)
  return match ? match[1] : null
}

function processTokenCategory(
  tokens: any,
  output: Record<string, string>,
  category: string,
  keyTransform: (key: string) => string,
  isSemantic: boolean,
): void {
  for (const [tokenKey, tokenValue] of Object.entries(tokens)) {
    const transformedKey = keyTransform(tokenKey)

    if (typeof tokenValue === 'string' || typeof tokenValue === 'number') {
      output[transformedKey] = String(tokenValue)
    } else if (typeof tokenValue === 'object' && tokenValue !== null) {
      if ('value' in tokenValue) {
        // Handle token objects with .value properties
        const value = tokenValue.value

        if (isSemantic && typeof value === 'object' && value !== null) {
          // Semantic token with conditional values - convert to CSS variable
          output[transformedKey] = `var(--${category}-${transformedKey.replace(/\./g, '-')})`
        } else if (Array.isArray(value)) {
          // Handle array values (like shadows with multiple layers)
          output[transformedKey] = value.join(', ')
        } else if (typeof value === 'string' || typeof value === 'number') {
          if (isSemantic) {
            // Convert semantic token to CSS variable reference
            output[transformedKey] = `var(--${category}-${transformedKey.replace(/\./g, '-')})`
          } else {
            // Regular token - use direct value
            output[transformedKey] = String(value)
          }
        }
      } else {
        // Handle nested token objects (like colors.red.500)
        processTokenCategory(tokenValue, output, category, (nestedKey) => `${transformedKey}.${nestedKey}`, isSemantic)
      }
    }
  }
}

function generateDefaultTokens(pandaPreset: any): Record<string, Record<string, string>> {
  console.log('🎨 Extracting default tokens from panda preset...')

  const defaultTokens: Record<string, Record<string, string>> = {
    colors: {},
    spacing: {},
    fonts: {},
    fontSizes: {},
    fontWeights: {},
    lineHeights: {},
    letterSpacings: {},
    sizes: {},
    shadows: {},
    radii: {},
    zIndex: {},
  }

  const theme = pandaPreset.theme || {}

  console.log('   🔍 Available theme keys:', Object.keys(theme))

  // Look for tokens at different possible locations
  const possiblePaths = [
    // Direct theme access
    { path: theme, prefix: 'theme', isSemantic: false },
    // Nested tokens (regular tokens)
    { path: theme.tokens || {}, prefix: 'theme.tokens', isSemantic: false },
    // Semantic tokens
    { path: theme.semanticTokens || {}, prefix: 'theme.semanticTokens', isSemantic: true },
  ]

  for (const { path, prefix } of possiblePaths) {
    if (path && typeof path === 'object') {
      console.log(`   🔍 Checking ${prefix}, keys:`, Object.keys(path))
    }
  }

  // Extract token categories that match our TokenCategories interface
  const tokenMapping = {
    colors: ['colors', 'color'],
    spacing: ['spacing', 'space', 'sizes'],
    fonts: ['fonts', 'fontFamily'],
    fontSizes: ['fontSizes', 'fontSize'],
    fontWeights: ['fontWeights', 'fontWeight'],
    lineHeights: ['lineHeights', 'lineHeight'],
    letterSpacings: ['letterSpacings', 'letterSpacing'],
    sizes: ['sizes', 'size'],
    shadows: ['shadows', 'shadow', 'dropShadows'],
    radii: ['radii', 'radius', 'borderRadius'],
    zIndex: ['zIndex', 'z'],
  }

  // Process regular tokens first, then semantic tokens
  for (const { path: tokenPath, isSemantic } of possiblePaths) {
    if (!tokenPath || typeof tokenPath !== 'object') continue

    for (const [key, possibleKeys] of Object.entries(tokenMapping)) {
      for (const themeKey of possibleKeys) {
        if (tokenPath[themeKey] && typeof tokenPath[themeKey] === 'object') {
          const tokens = tokenPath[themeKey]

          // Process tokens based on type
          processTokenCategory(tokens, defaultTokens[key], key, (tokenKey) => tokenKey, isSemantic)

          if (Object.keys(defaultTokens[key]).length > 0) {
            console.log(
              `   📋 Extracted ${Object.keys(defaultTokens[key]).length} ${key} tokens from ${themeKey} (${isSemantic ? 'semantic' : 'regular'})`,
            )
            if (!isSemantic) break // For regular tokens, stop after first match. For semantic, merge all
          }
        }
      }
    }
  }

  // Add some essential fallback tokens if not present
  if (!defaultTokens.colors.transparent) {
    defaultTokens.colors.transparent = 'transparent'
  }
  if (!defaultTokens.colors.current) {
    defaultTokens.colors.current = 'currentColor'
  }

  // Enhance spacing tokens with missing values
  const additionalSpacingTokens = {
    // Negative spacing values for margins
    '-0.5': '-0.125rem',
    '-1': '-0.25rem',
    '-1.5': '-0.375rem',
    '-2': '-0.5rem',
    '-2.5': '-0.625rem',
    '-3': '-0.75rem',
    '-3.5': '-0.875rem',
    '-4': '-1rem',
    '-5': '-1.25rem',
    '-6': '-1.5rem',
    '-7': '-1.75rem',
    '-8': '-2rem',
    '-9': '-2.25rem',
    '-10': '-2.5rem',
    '-11': '-2.75rem',
    '-12': '-3rem',
    '-14': '-3.5rem',
    '-16': '-4rem',
    '-20': '-5rem',
    '-24': '-6rem',
    '-28': '-7rem',
    '-32': '-8rem',
    '-36': '-9rem',
    '-40': '-10rem',
    '-44': '-11rem',
    '-48': '-12rem',
    '-52': '-13rem',
    '-56': '-14rem',
    '-60': '-15rem',
    '-64': '-16rem',
    '-72': '-18rem',
    '-80': '-20rem',
    '-96': '-24rem',

    // Fractional percentage values
    '1/2': '50%',
    '1/3': '33.333333%',
    '2/3': '66.666667%',
    '1/4': '25%',
    '2/4': '50%',
    '3/4': '75%',
    '1/5': '20%',
    '2/5': '40%',
    '3/5': '60%',
    '4/5': '80%',
    '1/6': '16.666667%',
    '2/6': '33.333333%',
    '3/6': '50%',
    '4/6': '66.666667%',
    '5/6': '83.333333%',
    '1/12': '8.333333%',
    '2/12': '16.666667%',
    '3/12': '25%',
    '4/12': '33.333333%',
    '5/12': '41.666667%',
    '6/12': '50%',
    '7/12': '58.333333%',
    '8/12': '66.666667%',
    '9/12': '75%',
    '10/12': '83.333333%',
    '11/12': '91.666667%',

    // Pixel-based values
    px: '1px',

    // Additional standard increments
    '13': '3.25rem',
    '15': '3.75rem',
    '17': '4.25rem',
    '18': '4.5rem',
    '19': '4.75rem',
    '21': '5.25rem',
    '22': '5.5rem',
    '23': '5.75rem',
  }

  // Enhance sizes tokens with missing values
  const additionalSizesTokens = {
    // Screen-based sizes
    screen: '100vw',
    dvh: '100dvh',
    lvh: '100lvh',
    svh: '100svh',
    dvw: '100dvw',
    lvw: '100lvw',
    svw: '100svw',

    // Additional container sizes
    '9xl': '96rem',
    '10xl': '104rem',
    '11xl': '112rem',
    '12xl': '120rem',

    // Auto sizing
    auto: 'auto',

    // All the same fractional percentage values as spacing
    ...Object.fromEntries(
      Object.entries(additionalSpacingTokens)
        .filter(([key]) => key.includes('/'))
        .map(([key, value]) => [key, value]),
    ),

    // All the same negative values for sizing
    ...Object.fromEntries(
      Object.entries(additionalSpacingTokens)
        .filter(([key]) => key.startsWith('-'))
        .map(([key, value]) => [key, value]),
    ),
  }

  // Add missing spacing tokens
  const addedSpacingCount = Object.keys(additionalSpacingTokens).filter((key) => !defaultTokens.spacing[key]).length
  Object.assign(defaultTokens.spacing, additionalSpacingTokens)
  if (addedSpacingCount > 0) {
    console.log(`   📋 Added ${addedSpacingCount} additional spacing tokens`)
  }

  // Add missing sizes tokens
  const addedSizesCount = Object.keys(additionalSizesTokens).filter((key) => !defaultTokens.sizes[key]).length
  Object.assign(defaultTokens.sizes, additionalSizesTokens)
  if (addedSizesCount > 0) {
    console.log(`   📋 Added ${addedSizesCount} additional sizes tokens`)
  }

  if (Object.keys(defaultTokens.spacing).length === 0) {
    Object.assign(defaultTokens.spacing, {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '6': '1.5rem',
      '8': '2rem',
      '12': '3rem',
      '16': '4rem',
      '24': '6rem',
    })
    console.log('   📋 Added fallback spacing tokens')
  }

  if (Object.keys(defaultTokens.fontSizes).length === 0) {
    Object.assign(defaultTokens.fontSizes, {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    })
    console.log('   📋 Added fallback fontSize tokens')
  }

  const totalTokens = Object.values(defaultTokens).reduce((sum, category) => sum + Object.keys(category).length, 0)
  console.log(`   ✅ Generated ${totalTokens} total default tokens`)

  return defaultTokens
}

function getCommonPropertyMappings(): Record<string, string> {
  // Common CSS property to token category mappings based on web standards
  return {
    // Colors
    color: 'colors',
    backgroundColor: 'colors',
    borderColor: 'colors',
    outlineColor: 'colors',
    textDecorationColor: 'colors',
    caretColor: 'colors',
    accentColor: 'colors',
    scrollbarColor: 'colors',

    // Spacing
    margin: 'spacing',
    marginTop: 'spacing',
    marginRight: 'spacing',
    marginBottom: 'spacing',
    marginLeft: 'spacing',
    marginBlock: 'spacing',
    marginInline: 'spacing',
    marginBlockStart: 'spacing',
    marginBlockEnd: 'spacing',
    marginInlineStart: 'spacing',
    marginInlineEnd: 'spacing',
    padding: 'spacing',
    paddingTop: 'spacing',
    paddingRight: 'spacing',
    paddingBottom: 'spacing',
    paddingLeft: 'spacing',
    paddingBlock: 'spacing',
    paddingInline: 'spacing',
    paddingBlockStart: 'spacing',
    paddingBlockEnd: 'spacing',
    paddingInlineStart: 'spacing',
    paddingInlineEnd: 'spacing',
    gap: 'spacing',
    columnGap: 'spacing',
    rowGap: 'spacing',
    spaceX: 'spacing',
    spaceY: 'spacing',

    // Typography
    fontFamily: 'fonts',
    fontSize: 'fontSizes',
    fontWeight: 'fontWeights',
    lineHeight: 'lineHeights',
    letterSpacing: 'letterSpacings',

    // Sizes
    width: 'sizes',
    height: 'sizes',
    maxWidth: 'sizes',
    maxHeight: 'sizes',
    minWidth: 'sizes',
    minHeight: 'sizes',
    blockSize: 'sizes',
    inlineSize: 'sizes',
    maxBlockSize: 'sizes',
    maxInlineSize: 'sizes',
    minBlockSize: 'sizes',
    minInlineSize: 'sizes',

    // Shadows
    boxShadow: 'shadows',
    textShadow: 'shadows',
    dropShadow: 'shadows',

    // Radii
    borderRadius: 'radii',
    borderTopLeftRadius: 'radii',
    borderTopRightRadius: 'radii',
    borderBottomLeftRadius: 'radii',
    borderBottomRightRadius: 'radii',
    borderStartStartRadius: 'radii',
    borderStartEndRadius: 'radii',
    borderEndStartRadius: 'radii',
    borderEndEndRadius: 'radii',

    // Z-index
    zIndex: 'zIndex',

    // Borders (widths use spacing, but could be separate)
    borderWidth: 'spacing',
    borderTopWidth: 'spacing',
    borderRightWidth: 'spacing',
    borderBottomWidth: 'spacing',
    borderLeftWidth: 'spacing',
    borderBlockWidth: 'spacing',
    borderInlineWidth: 'spacing',
    borderBlockStartWidth: 'spacing',
    borderBlockEndWidth: 'spacing',
    borderInlineStartWidth: 'spacing',
    borderInlineEndWidth: 'spacing',

    // Outline
    outlineWidth: 'spacing',
    outlineOffset: 'spacing',
  }
}

async function main(): Promise<void> {
  console.log('🚀 Generating Panda CSS utility mappings from preset imports...')

  try {
    console.log('📦 Loading presets...')
    console.log('   Base preset:', basePreset.name)
    console.log('   Panda preset:', pandaPreset.name)

    // Parse utilities from base preset
    const { utilityMap, shorthandMap } = parseUtilities(basePreset.utilities || {})

    // Parse conditions from base preset
    const conditionMap = parseConditions(basePreset.conditions || {})

    // Extract breakpoints and conditions for direct usage
    const breakpoints = extractBreakpoints(pandaPreset)
    const conditions = extractConditions(basePreset)

    // Parse breakpoints from panda preset if available
    if (pandaPreset.theme?.breakpoints) {
      console.log('🔧 Adding breakpoints from panda preset...')
      for (const [breakpoint] of Object.entries(pandaPreset.theme.breakpoints)) {
        conditionMap.set(breakpoint, breakpoint)
      }
      console.log(`   ✅ Added ${Object.keys(pandaPreset.theme.breakpoints).length} breakpoints from panda preset`)
    }

    // Generate property to token category mapping
    const propertyToTokenCategory = generatePropertyToTokenCategory(pandaPreset, basePreset)

    // Generate default tokens from panda preset
    const defaultTokens = generateDefaultTokens(pandaPreset)

    console.log('📝 Generating mappings.ts...')
    const generatedContent = generateMappingFile(
      utilityMap,
      shorthandMap,
      conditionMap,
      breakpoints,
      conditions,
      propertyToTokenCategory,
      defaultTokens,
    )

    // Write to file
    const outputPath = join(__dirname, '../src/mappings.ts')
    writeFileSync(outputPath, generatedContent, 'utf-8')

    console.log('🎉 Successfully generated mappings!')
    console.log(`   📍 Output: ${outputPath}`)
    console.log(`   📊 Statistics:`)
    console.log(`      - Utilities: ${utilityMap.size}`)
    console.log(`      - Shorthands: ${shorthandMap.size}`)
    console.log(`      - Conditions: ${conditionMap.size}`)
    console.log(`      - Breakpoints: ${Object.keys(breakpoints).length}`)
    console.log(`      - Total mappings: ${utilityMap.size + shorthandMap.size + conditionMap.size}`)
  } catch (error) {
    console.error('❌ Failed to generate mappings:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
