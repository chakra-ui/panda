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
`

  return template
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

    // Parse breakpoints from panda preset if available
    if (pandaPreset.theme?.breakpoints) {
      console.log('🔧 Adding breakpoints from panda preset...')
      for (const [breakpoint] of Object.entries(pandaPreset.theme.breakpoints)) {
        conditionMap.set(breakpoint, breakpoint)
      }
      console.log(`   ✅ Added ${Object.keys(pandaPreset.theme.breakpoints).length} breakpoints from panda preset`)
    }

    console.log('📝 Generating mappings.ts...')
    const generatedContent = generateMappingFile(utilityMap, shorthandMap, conditionMap)

    // Write to file
    const outputPath = join(__dirname, '../src/mappings.ts')
    writeFileSync(outputPath, generatedContent, 'utf-8')

    console.log('🎉 Successfully generated mappings!')
    console.log(`   📍 Output: ${outputPath}`)
    console.log(`   📊 Statistics:`)
    console.log(`      - Utilities: ${utilityMap.size}`)
    console.log(`      - Shorthands: ${shorthandMap.size}`)
    console.log(`      - Conditions: ${conditionMap.size}`)
    console.log(`      - Total mappings: ${utilityMap.size + shorthandMap.size + conditionMap.size}`)
  } catch (error) {
    console.error('❌ Failed to generate mappings:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
