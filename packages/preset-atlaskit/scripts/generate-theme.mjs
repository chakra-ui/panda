#!/usr/bin/env node

/**
 * Script to autogenerate Panda CSS theme from @atlaskit/tokens
 *
 * This script reads the token data from @atlaskit/tokens package and converts it
 * to Panda CSS token format, generating TypeScript files for each category.
 *
 * Usage:
 *   node scripts/generate-theme.mjs          # Generate theme (keeps existing files)
 *   node scripts/generate-theme.mjs --clean  # Clean src/ directory first, then generate
 */

import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const srcDir = join(__dirname, '../src')

// Version compatibility - this script was built for @atlaskit/tokens 13.x
const COMPATIBLE_VERSION_RANGE = '13.x'
const TESTED_VERSION = '13.0.2'

/**
 * Check @atlaskit/tokens version compatibility
 */
function checkVersionCompatibility() {
  try {
    const packageJsonPath = join(__dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const installedVersion = packageJson.devDependencies?.['@atlaskit/tokens']

    if (installedVersion) {
      const majorVersion = installedVersion.match(/^[\^~]?(\d+)/)?.[1]
      const compatibleMajor = COMPATIBLE_VERSION_RANGE.match(/^(\d+)/)?.[1]

      if (majorVersion !== compatibleMajor) {
        console.warn(`
⚠️  WARNING: Version Compatibility Issue
   This script was built for @atlaskit/tokens ${COMPATIBLE_VERSION_RANGE} (tested on ${TESTED_VERSION})
   You have version ${installedVersion} installed

   The script may fail or produce incorrect output if @atlaskit/tokens had breaking changes.
   Consider pinning to version ${COMPATIBLE_VERSION_RANGE} or regenerating carefully.
`)
        return false
      }
    }
    return true
  } catch (error) {
    console.warn('⚠️  Could not verify @atlaskit/tokens version compatibility')
    return true // Continue anyway
  }
}

// Import token data from @atlaskit/tokens
// NOTE: These are internal artifact paths and may change in future versions
let atlassianLight, atlassianDark, atlassianSpacing, atlassianTypography, atlassianShape
try {
  atlassianLight = (await import('@atlaskit/tokens/dist/esm/artifacts/tokens-raw/atlassian-light.js')).default
  atlassianDark = (await import('@atlaskit/tokens/dist/esm/artifacts/tokens-raw/atlassian-dark.js')).default
  atlassianSpacing = (await import('@atlaskit/tokens/dist/esm/artifacts/tokens-raw/atlassian-spacing.js')).default
  atlassianTypography = (await import('@atlaskit/tokens/dist/esm/artifacts/tokens-raw/atlassian-typography.js')).default
  atlassianShape = (await import('@atlaskit/tokens/dist/esm/artifacts/tokens-raw/atlassian-shape.js')).default
} catch (error) {
  console.error(`
❌ ERROR: Failed to import @atlaskit/tokens data

   This likely means:
   1. @atlaskit/tokens package structure changed (breaking change)
   2. The internal artifact paths changed
   3. Package is not installed correctly

   Error: ${error.message}

   Try:
   - Check if @atlaskit/tokens major version changed
   - Reinstall: pnpm install --ignore-scripts
   - Check @atlaskit/tokens CHANGELOG for breaking changes
`)
  process.exit(1)
}

// Import motion data from @atlaskit/motion
let atlaskitMotion
try {
  // Import directly from the compiled JavaScript files to avoid CSS import issues
  const durationsModule = await import('@atlaskit/motion/dist/cjs/utils/durations.js')
  const curvesModule = await import('@atlaskit/motion/dist/cjs/utils/curves.js')

  // Combine durations and all curve exports dynamically
  atlaskitMotion = {
    durations: durationsModule.durations,
    ...curvesModule,
  }
} catch (error) {
  console.warn(`
⚠️  WARNING: Failed to import @atlaskit/motion

   Motion tokens (durations, easings) will not be generated.
   Install @atlaskit/motion to enable: pnpm add @atlaskit/motion --ignore-scripts

   Error: ${error.message}
`)
  atlaskitMotion = null
}

// Breakpoints are not part of @atlaskit/tokens - these are from Atlassian Design System
// Source: https://atlassian.design (mobile-first responsive breakpoints)
const breakpoints = {
  sm: '30rem', // 480px - Small
  md: '48rem', // 768px - Medium
  lg: '64rem', // 1024px - Large
  xl: '90rem', // 1440px - XLarge
  '2xl': '110.5rem', // 1768px - XXLarge
}

/**
 * Validate token structure to catch breaking changes early
 */
function validateTokenStructure(token, context = 'unknown') {
  if (!token || typeof token !== 'object') {
    console.warn(`⚠️  Invalid token in ${context}: not an object`)
    return false
  }

  if (!Array.isArray(token.path)) {
    console.warn(`⚠️  Invalid token in ${context}: missing or invalid 'path' array`)
    return false
  }

  if (token.value === undefined) {
    console.warn(`⚠️  Invalid token in ${context}: missing 'value'`)
    return false
  }

  return true
}

/**
 * Converts a dot-notation path to a nested object
 * e.g., ['color', 'text'] => { color: { text: value } }
 *
 * Handles [default] entries:
 * - Removes all [default] from the path
 * - If the last element was [default], uses 'DEFAULT' as the final key
 */
function setNestedValue(obj, path, value) {
  // Filter out all [default] entries and track if we had one at the end
  const hasDefaultAtEnd = path[path.length - 1] === '[default]'
  const cleanPath = path.filter((key) => key !== '[default]')

  // If the entire path was just [default] entries, skip it
  if (cleanPath.length === 0) {
    return
  }

  // Navigate to the parent
  let current = obj
  for (let i = 0; i < cleanPath.length - 1; i++) {
    const key = cleanPath[i]
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }

  // Set the final value
  const lastKey = cleanPath[cleanPath.length - 1]

  // If we had [default] at the end, create a DEFAULT property
  if (hasDefaultAtEnd) {
    if (!(lastKey in current)) {
      current[lastKey] = {}
    }
    current[lastKey].DEFAULT = value
  } else {
    current[lastKey] = value
  }
}

/**
 * Processes tokens and organizes them into Panda CSS format
 */
function processTokens(lightTokens, darkTokens = []) {
  const tokens = {}
  const semanticTokens = {}

  // Build a map of dark token values by cleanName
  const darkTokenMap = new Map()
  darkTokens.forEach((token) => {
    darkTokenMap.set(token.cleanName, token.value)
  })

  lightTokens.forEach((token) => {
    const { path: tokenPath, value: lightValue, cleanName } = token

    // Check if there's a different dark value
    const darkValue = darkTokenMap.get(cleanName)
    const hasDarkVariant = darkValue && darkValue !== lightValue

    if (hasDarkVariant) {
      // This is a semantic token with light/dark variants
      const semanticValue = {
        value: {
          _light: lightValue,
          _dark: darkValue,
        },
      }
      setNestedValue(semanticTokens, tokenPath, semanticValue)
    } else {
      // Regular token (or same in both themes)
      const tokenValue = { value: lightValue }
      setNestedValue(tokens, tokenPath, tokenValue)
    }
  })

  return { tokens, semanticTokens }
}

/**
 * Processes spacing tokens
 */
function processSpacing(spacingTokens) {
  const spacing = {}

  spacingTokens.forEach((token) => {
    // Remove the first 'space' from path and use the rest
    const path = token.path.slice(1)
    setNestedValue(spacing, path, { value: token.value })
  })

  return spacing
}

/**
 * Processes typography tokens with error handling
 */
function processTypography(typographyTokens) {
  const typography = {
    fonts: {},
    fontSizes: {},
    fontWeights: {},
    lineHeights: {},
    letterSpacings: {},
  }

  let skippedTokens = 0

  typographyTokens.forEach((token, index) => {
    if (!validateTokenStructure(token, `typography[${index}]`)) {
      skippedTokens++
      return
    }

    const { value, path: tokenPath, cleanName } = token

    // Handle standalone weight tokens (e.g., font.weight.bold = "653")
    if (tokenPath[0] === 'font' && tokenPath[1] === 'weight') {
      const weightName = tokenPath[2]
      if (weightName && /^\d+$/.test(value)) {
        typography.fontWeights[weightName] = { value }
        return
      }
    }

    // Handle standalone font family tokens (e.g., font.family.heading = "Atlassian Sans, ...")
    if (tokenPath[0] === 'font' && tokenPath[1] === 'family') {
      const path = tokenPath.slice(2)
      const primaryFamily = value.match(/"([^"]+)"/)?.[1] || value.split(',')[0].trim()
      setNestedValue(typography.fonts, path, { value: primaryFamily })
      return
    }

    // Parse font shorthand: "normal 653 32px/36px "Atlassian Sans", ..."
    // Try multiple patterns for robustness
    let fontMatch = value.match(/^(\w+)\s+(\d+)\s+([\d.]+(?:px|rem|em))\/([\d.]+(?:px|rem|em)?)\s+(.+)$/)

    if (!fontMatch) {
      // Try without font-style (in case format changes)
      fontMatch = value.match(/^(\d+)\s+([\d.]+(?:px|rem|em))\/([\d.]+(?:px|rem|em)?)\s+(.+)$/)
      if (fontMatch) {
        // Adjust extraction if no font-style
        const [, fontWeight, fontSize, lineHeight, fontFamily] = fontMatch
        const path = tokenPath.slice(1)
        const primaryFamily = fontFamily.match(/"([^"]+)"/)?.[1] || fontFamily.split(',')[0].trim()

        setNestedValue(typography.fonts, path, { value: primaryFamily })
        setNestedValue(typography.fontSizes, path, { value: fontSize })
        setNestedValue(typography.lineHeights, path, { value: lineHeight })
        return
      }
    }

    if (fontMatch) {
      const [, , fontWeight, fontSize, lineHeight, fontFamily] = fontMatch
      const path = tokenPath.slice(1)
      const primaryFamily = fontFamily.match(/"([^"]+)"/)?.[1] || fontFamily.split(',')[0].trim()

      setNestedValue(typography.fonts, path, { value: primaryFamily })
      setNestedValue(typography.fontSizes, path, { value: fontSize })
      setNestedValue(typography.lineHeights, path, { value: lineHeight })
    } else {
      console.warn(`⚠️  Could not parse typography token: ${cleanName || tokenPath.join('.')}`)
      console.warn(`   Value: ${value}`)
      skippedTokens++
    }
  })

  if (skippedTokens > 0) {
    console.warn(`⚠️  Skipped ${skippedTokens} typography token(s) due to parsing issues`)
  }

  return typography
}

/**
 * Processes text styles from typography tokens
 * Creates semantic typography presets that combine font family, weight, size, and line height
 */
function processTextStyles(typographyTokens) {
  const textStyles = {}
  let skippedTokens = 0

  typographyTokens.forEach((token, index) => {
    if (!validateTokenStructure(token, `textStyles[${index}]`)) {
      skippedTokens++
      return
    }

    const { value, path: tokenPath, cleanName } = token

    // Only process composite font tokens (not standalone weight/family tokens)
    if (tokenPath.length < 3 || tokenPath[1] === 'weight' || tokenPath[1] === 'family') {
      return
    }

    // Parse font shorthand: "normal 653 32px/36px "Atlassian Sans", ..."
    // Try multiple patterns for robustness
    let fontMatch = value.match(/^(\w+)\s+(\d+)\s+([\d.]+(?:px|rem|em))\/([\d.]+(?:px|rem|em)?)\s+(.+)$/)

    if (!fontMatch) {
      // Try without font-style
      fontMatch = value.match(/^(\d+)\s+([\d.]+(?:px|rem|em))\/([\d.]+(?:px|rem|em)?)\s+(.+)$/)
      if (fontMatch) {
        const [, fontWeight, fontSize, lineHeight, fontFamily] = fontMatch
        const path = tokenPath.slice(1)
        const primaryFamily = fontFamily.match(/"([^"]+)"/)?.[1] || fontFamily.split(',')[0].trim()

        const textStyleValue = {
          value: {
            fontFamily: primaryFamily,
            fontWeight,
            fontSize,
            lineHeight,
          },
        }
        setNestedValue(textStyles, path, textStyleValue)
        return
      }
    }

    if (fontMatch) {
      const [, , fontWeight, fontSize, lineHeight, fontFamily] = fontMatch
      const path = tokenPath.slice(1)
      const primaryFamily = fontFamily.match(/"([^"]+)"/)?.[1] || fontFamily.split(',')[0].trim()

      const textStyleValue = {
        value: {
          fontFamily: primaryFamily,
          fontWeight,
          fontSize,
          lineHeight,
        },
      }
      setNestedValue(textStyles, path, textStyleValue)
    }
  })

  if (skippedTokens > 0) {
    console.warn(`⚠️  Skipped ${skippedTokens} textStyle token(s)`)
  }

  return textStyles
}

/**
 * Processes shape/radius tokens
 */
function processRadii(shapeTokens) {
  const radii = {}

  shapeTokens.forEach((token) => {
    // Remove the first 'radius' from path and use the rest
    const path = token.path.slice(1)
    setNestedValue(radii, path, { value: token.value })
  })

  return radii
}

/**
 * Converts shadow token array to CSS box-shadow string with validation
 * e.g., [{"radius":8,"offset":{"x":0,"y":0},"color":"#091E42","opacity":0.16}, ...]
 * to "0px 0px 8px rgba(9, 30, 66, 0.16), ..."
 */
function convertShadowToCss(shadowArray, tokenName = 'unknown') {
  if (!Array.isArray(shadowArray)) return shadowArray

  try {
    return shadowArray
      .map((shadow, index) => {
        // Validate shadow object structure
        if (!shadow || typeof shadow !== 'object') {
          throw new Error(`Shadow[${index}] is not an object`)
        }

        const { radius, offset, color, opacity } = shadow

        if (radius === undefined || offset === undefined || color === undefined || opacity === undefined) {
          throw new Error(`Shadow[${index}] missing required properties (radius, offset, color, opacity)`)
        }

        const x = offset?.x ?? 0
        const y = offset?.y ?? 0

        // Validate color format
        if (!color || typeof color !== 'string' || !color.startsWith('#')) {
          throw new Error(`Shadow[${index}] has invalid color format: ${color}`)
        }

        // Convert hex color to rgba with opacity
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)

        if (isNaN(r) || isNaN(g) || isNaN(b)) {
          throw new Error(`Shadow[${index}] has invalid hex color: ${color}`)
        }

        return `${x}px ${y}px ${radius}px rgba(${r}, ${g}, ${b}, ${opacity})`
      })
      .join(',')
  } catch (error) {
    console.warn(`⚠️  Error converting shadow token '${tokenName}': ${error.message}`)
    console.warn(`   Returning original value`)
    return shadowArray
  }
}

/**
 * Processes motion tokens from @atlaskit/motion package
 * Extracts durations and easing curves for animations
 */
function processMotion(motionPackage) {
  if (!motionPackage) {
    return { durations: {}, easings: {} }
  }

  const durations = {}
  const easings = {}

  try {
    // Extract durations
    if (motionPackage.durations) {
      Object.entries(motionPackage.durations).forEach(([key, value]) => {
        durations[key] = { value: `${value}ms` }
      })
    }

    // Extract easing curves dynamically - any string value that starts with 'cubic-bezier'
    Object.entries(motionPackage).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('cubic-bezier')) {
        easings[key] = { value }
      }
    })
  } catch (error) {
    console.warn('⚠️  Error processing motion tokens:', error.message)
  }

  return { durations, easings }
}

/**
 * Processes shadow tokens from elevation.shadow
 */
function processShadows(lightTokens, darkTokens) {
  const shadows = {}

  // Filter shadow tokens only - exclude perimeter and spread (they're color fallbacks, not shadows)
  const lightShadows = lightTokens.filter(
    (t) =>
      t.path[0] === 'elevation' &&
      t.path[1] === 'shadow' &&
      !t.cleanName.includes('perimeter') &&
      !t.cleanName.includes('spread'),
  )
  const darkShadows = darkTokens.filter(
    (t) =>
      t.path[0] === 'elevation' &&
      t.path[1] === 'shadow' &&
      !t.cleanName.includes('perimeter') &&
      !t.cleanName.includes('spread'),
  )

  // Build a map of dark shadow values
  const darkShadowMap = new Map()
  darkShadows.forEach((token) => {
    darkShadowMap.set(token.cleanName, token.value)
  })

  lightShadows.forEach((token) => {
    if (!validateTokenStructure(token, 'shadow')) {
      return
    }

    // Remove 'elevation.shadow' from path
    const path = token.path.slice(2)
    const lightValue = convertShadowToCss(token.value, token.cleanName)
    const darkValue = convertShadowToCss(darkShadowMap.get(token.cleanName), token.cleanName)

    const hasDarkVariant = darkValue && darkValue !== lightValue

    if (hasDarkVariant) {
      const semanticValue = {
        value: {
          _light: lightValue,
          _dark: darkValue,
        },
      }
      setNestedValue(shadows, path, semanticValue)
    } else {
      setNestedValue(shadows, path, { value: lightValue })
    }
  })

  return shadows
}

/**
 * Formats a JavaScript object as a TypeScript export string
 */
function formatAsTypeScript(obj, depth = 0) {
  const indent = '  '.repeat(depth)
  const entries = Object.entries(obj)

  if (entries.length === 0) return '{}'

  const lines = entries.map(([key, value]) => {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if ('value' in value) {
        // This is a token value
        if (typeof value.value === 'object') {
          // Conditional value
          const subObj = formatAsTypeScript(value.value, depth + 1)
          return `${indent}  ${safeKey}: { value: ${subObj} },`
        }
        return `${indent}  ${safeKey}: { value: '${value.value}' },`
      } else {
        // Nested object
        const nested = formatAsTypeScript(value, depth + 1)
        return `${indent}  ${safeKey}: ${nested},`
      }
    }

    return `${indent}  ${safeKey}: ${JSON.stringify(value)},`
  })

  return `{\n${lines.join('\n')}\n${indent}}`
}

/**
 * Generates a TypeScript file with the given content
 */
function generateFile(filename, exportName, content, importType = '') {
  let imports = ''
  let typeAnnotation = ''

  if (importType) {
    imports = `import type { ${importType} } from '@pandacss/types'\n\n`
    // Add type annotation based on import type
    if (importType === 'SemanticTokens') {
      typeAnnotation = `: ${importType}['${exportName.replace('semantic', '').replace('Semantic', '').toLowerCase()}']`
    } else if (importType === 'Theme') {
      typeAnnotation = `: ${importType}['${exportName}']`
    } else if (importType === 'Tokens') {
      typeAnnotation = `: ${importType}['${exportName}']`
    }
  }

  const formatted = formatAsTypeScript(content)
  const fileContent = `${imports}export const ${exportName}${typeAnnotation} = ${formatted}\n`

  const filePath = join(srcDir, filename)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, fileContent, 'utf-8')
  console.log(`✓ Generated ${filename}`)
}

/**
 * Main generation function
 */
function generateTheme() {
  console.log('🚀 Generating Panda CSS theme from @atlaskit/tokens...\n')

  // Check version compatibility
  checkVersionCompatibility()

  // Process color tokens (light and dark)
  console.log('📦 Processing color tokens...')
  let colorTokens, semanticColors
  try {
    const result = processTokens(
      atlassianLight.filter((t) => t.path[0] === 'color'),
      atlassianDark.filter((t) => t.path[0] === 'color'),
    )
    colorTokens = result.tokens
    semanticColors = result.semanticTokens
  } catch (error) {
    console.error('❌ Error processing color tokens:', error.message)
    throw error
  }

  // Extract core colors (non-semantic)
  const colors = colorTokens.color || {}
  generateFile('colors/core.ts', 'colors', colors, 'Tokens')

  // Generate semantic colors
  const semanticColorValues = semanticColors.color || {}
  generateFile('colors/semantic.ts', 'semanticColors', semanticColorValues, 'SemanticTokens')

  // Process opacity tokens
  console.log('📦 Processing opacity tokens...')
  let opacityTokens
  try {
    const result = processTokens(
      atlassianLight.filter((t) => t.path[0] === 'opacity'),
      atlassianDark.filter((t) => t.path[0] === 'opacity'),
    )
    opacityTokens = result.tokens
  } catch (error) {
    console.error('❌ Error processing opacity tokens:', error.message)
    throw error
  }

  // Generate opacity tokens
  const opacity = opacityTokens.opacity || {}
  generateFile('opacity.ts', 'opacity', opacity, 'Tokens')

  // Process spacing
  console.log('📦 Processing spacing tokens...')
  const spacing = processSpacing(atlassianSpacing)
  generateFile('spacing.ts', 'spacing', spacing, 'Tokens')

  // Process typography
  console.log('📦 Processing typography tokens...')
  const typography = processTypography(atlassianTypography)
  generateFile('typography/sizes.ts', 'fontSizes', typography.fontSizes, 'Tokens')
  generateFile('typography/fonts.ts', 'fonts', typography.fonts, 'Tokens')
  generateFile('typography/weights.ts', 'fontWeights', typography.fontWeights, 'Tokens')
  generateFile('typography/lineHeights.ts', 'lineHeights', typography.lineHeights, 'Tokens')

  // Process text styles
  console.log('📦 Processing text styles...')
  const textStyles = processTextStyles(atlassianTypography)
  generateFile('textStyles.ts', 'textStyles', textStyles, 'Theme')

  // Process radii (only radius tokens, not border.width)
  console.log('📦 Processing shape/radii tokens...')
  const radii = processRadii(atlassianShape.filter((t) => t.path[0] === 'radius'))
  generateFile('radii.ts', 'radii', radii, 'Tokens')

  // Process shadows
  console.log('📦 Processing shadow tokens...')
  const shadows = processShadows(atlassianLight, atlassianDark)
  generateFile('shadows.ts', 'semanticShadows', shadows, 'SemanticTokens')

  // Process motion tokens (durations and easings)
  if (atlaskitMotion) {
    console.log('📦 Processing motion tokens...')
    const { durations, easings } = processMotion(atlaskitMotion)
    generateFile('durations.ts', 'durations', durations, 'Tokens')
    generateFile('easings.ts', 'easings', easings, 'Tokens')
  } else {
    console.log('⏭️  Skipping motion tokens (package not installed)')
  }

  // Generate breakpoints (static, not from tokens)
  console.log('📦 Generating breakpoints...')
  generateFile('breakpoints.ts', 'breakpoints', breakpoints, 'Theme')

  // Generate main index file
  console.log('📦 Generating index file...')

  // Build imports based on what was generated
  const imports = [
    `import type { Preset } from '@pandacss/types'`,
    `import { breakpoints } from './breakpoints'`,
    `import { colors } from './colors/core'`,
    `import { semanticColors } from './colors/semantic'`,
    `import { opacity } from './opacity'`,
    `import { radii } from './radii'`,
    `import { semanticShadows } from './shadows'`,
    `import { spacing } from './spacing'`,
    `import { fontSizes } from './typography/sizes'`,
    `import { fonts } from './typography/fonts'`,
    `import { fontWeights } from './typography/weights'`,
    `import { lineHeights } from './typography/lineHeights'`,
    `import { textStyles } from './textStyles'`,
  ]

  const tokenEntries = [
    `      colors: colors,`,
    `      opacity: opacity,`,
    `      radii: radii,`,
    `      fontSizes: fontSizes,`,
    `      fontWeights: fontWeights,`,
    `      lineHeights: lineHeights,`,
    `      fonts: fonts,`,
    `      spacing: spacing,`,
  ]

  if (atlaskitMotion) {
    imports.push(`import { durations } from './durations'`)
    imports.push(`import { easings } from './easings'`)
    tokenEntries.push(`      durations: durations,`)
    tokenEntries.push(`      easings: easings,`)
  }

  const indexContent = `${imports.join('\n')}

const definePreset = <T extends Preset>(config: T) => config

export const preset = definePreset({
  name: '@pandacss/preset-atlaskit',
  theme: {
    breakpoints: breakpoints,
    tokens: {
${tokenEntries.join('\n')}
    },
    semanticTokens: {
      colors: semanticColors,
      shadows: semanticShadows,
    },
    textStyles: textStyles,
  },
})

export default preset
`

  const indexPath = join(srcDir, 'index.ts')
  writeFileSync(indexPath, indexContent, 'utf-8')
  console.log('✓ Generated index.ts')

  // Format generated files with prettier
  console.log('\n📝 Formatting generated files with prettier...')
  try {
    execSync(`pnpm exec prettier --write "${srcDir}/**/*.ts"`, { stdio: 'inherit', cwd: join(__dirname, '../../..') })
    console.log('✓ Files formatted successfully')
  } catch (error) {
    console.warn('⚠️  Prettier formatting failed:', error.message)
    console.warn('   Files were generated but not formatted')
  }

  console.log('\n✨ Theme generation complete!')
  console.log('\nℹ️  Note: The generated files have been written to the src/ directory.')
  console.log('   You may need to review and adjust the generated code.')
}

/**
 * Clean the src directory
 */
function cleanSrcDirectory() {
  console.log('🧹 Cleaning src directory...')

  if (existsSync(srcDir)) {
    rmSync(srcDir, { recursive: true, force: true })
    console.log('✓ Cleaned src directory')
  } else {
    console.log('ℹ️  src directory does not exist, skipping cleanup')
  }

  // Recreate the src directory
  mkdirSync(srcDir, { recursive: true })
}

// Parse command line arguments
const args = process.argv.slice(2)
const shouldClean = args.includes('--clean')

// Run the generation
try {
  if (shouldClean) {
    cleanSrcDirectory()
    console.log('')
  }

  generateTheme()
} catch (error) {
  console.error('❌ Error generating theme:', error)
  process.exit(1)
}
