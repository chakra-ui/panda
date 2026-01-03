import { flatten } from '@pandacss/shared'
import { Token, TokenDictionary } from '@pandacss/token-dictionary'
import type { TokenDataTypes } from '@pandacss/types'
import { config, themes as configThemes } from 'virtual:panda'

// Get current theme from URL params or use default
export const getCurrentTheme = (url?: string) => {
  // Client-side: read from window.location
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    return params.get('theme') || undefined
  }

  // Server-side: read from provided URL
  if (url) {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)
    return params.get('theme') || undefined
  }

  return undefined
}

export const availableThemes = Object.keys(configThemes || {})

// Deep merge objects recursively
const deepMerge = (target: any, source: any): any => {
  if (!source) return target
  if (!target) return source

  const result = { ...target }

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }

  return result
}

// Merge base theme with selected theme
export const getActiveTheme = (themeName?: string) => {
  const baseTheme = config.theme ?? {}

  if (!themeName || !configThemes?.[themeName]) {
    return baseTheme
  }

  const selectedTheme = configThemes[themeName]

  // Deep merge theme configuration
  return {
    ...baseTheme,
    tokens: deepMerge(baseTheme.tokens, selectedTheme.tokens),
    semanticTokens: deepMerge(baseTheme.semanticTokens, selectedTheme.semanticTokens),
    textStyles: deepMerge(baseTheme.textStyles, selectedTheme.textStyles),
    layerStyles: deepMerge(baseTheme.layerStyles, selectedTheme.layerStyles),
  }
}

export const theme = config.theme ?? {}

export const tokens = new TokenDictionary(theme).init()

export const getTokens = (category: keyof TokenDataTypes, themeName?: string): Token[] => {
  const activeTheme = getActiveTheme(themeName)
  const themeTokens = new TokenDictionary(activeTheme).init()
  const map = themeTokens.view.categoryMap.get(category) ?? new Map()
  return Array.from(map.values())
}

// Get token paths defined in a theme for a category
const getThemeDefinedPaths = (themeName: string, category: keyof TokenDataTypes): Set<string> => {
  const selectedTheme = configThemes?.[themeName]
  if (!selectedTheme) return new Set()

  const paths = new Set<string>()

  // Collect paths from tokens (e.g., colors.red.500)
  const collectPaths = (obj: any, prefix: string[] = []) => {
    if (!obj || typeof obj !== 'object') return
    for (const key in obj) {
      const path = [...prefix, key]
      if (obj[key]?.value !== undefined) {
        paths.add(path.join('.'))
      } else {
        collectPaths(obj[key], path)
      }
    }
  }

  collectPaths(selectedTheme.tokens?.[category])
  collectPaths(selectedTheme.semanticTokens?.[category])

  return paths
}

export const getThemeRelevantTokens = (category: keyof TokenDataTypes, themeName?: string): Token[] => {
  if (!themeName || !configThemes?.[themeName]) {
    // No theme selected - return all base tokens
    return getTokens(category)
  }

  const activeTheme = getActiveTheme(themeName)
  const themeTokens = new TokenDictionary(activeTheme).init()

  // Get all tokens for the category from merged theme
  const allTokens = Array.from(themeTokens.view.categoryMap.get(category)?.values() || [])

  // Get paths explicitly defined in this theme
  const definedPaths = getThemeDefinedPaths(themeName, category)

  // If theme doesn't define any tokens for this category, return empty
  if (definedPaths.size === 0) {
    return []
  }

  // Filter to tokens whose path matches theme-defined paths
  // Also include semantic tokens (isConditional) that are defined in the theme
  const themeTokensList = allTokens.filter((token) => {
    const tokenPath = token.path.join('.')
    return definedPaths.has(tokenPath) || token.isConditional
  })

  // Collect referenced tokens (for semantic tokens that reference base tokens)
  const referencedNames = new Set<string>()
  themeTokensList.forEach((token) => {
    if (token.extensions.references) {
      Object.keys(token.extensions.references).forEach((name) => referencedNames.add(name))
    }
    if (token.extensions.conditions) {
      Object.values(token.extensions.conditions).forEach((val) => {
        if (typeof val === 'string') {
          themeTokens.getReferences(val).forEach((ref) => referencedNames.add(ref.name))
        }
      })
    }
  })

  // Include referenced base tokens
  const referencedTokens = allTokens.filter(
    (token) => referencedNames.has(token.name) && !themeTokensList.includes(token),
  )

  return [...themeTokensList, ...referencedTokens]
}

type Colors = Array<{
  label: string
  value: string
}>

export const getColors = (themeName?: string): Colors =>
  getTokens('colors', themeName)
    .filter((color) => !color.isConditional && !color.extensions.isVirtual)
    .map((color) => ({
      label: color.extensions.prop,
      value: color.value,
    }))

export const colors: Colors = getColors()

export const textStyles = flatten(theme?.textStyles ?? {})

export const layerStyles = flatten(theme?.layerStyles ?? {})

export const logo = config.studio?.logo

export const inject = config.studio?.inject ?? { head: '', body: '' }
