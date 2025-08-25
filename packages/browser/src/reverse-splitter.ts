import { CLASS_TO_PROPERTY_MAP, SHORTHAND_ALIASES, CONDITION_MAP } from './mappings'
import { camelCaseProperty } from '@pandacss/shared'
import { isCssProperty } from '@pandacss/is-valid-prop'

/**
 * Converts a value string back to its original form
 * Handles underscores, dots, and special cases
 */
function parseValue(value: string): string | number {
  if (!value) return value

  // Handle numeric values (including decimals)
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = parseFloat(value)
    return Number.isInteger(num) ? parseInt(value) : num
  }

  // Handle CSS units and special values
  if (
    value === 'auto' ||
    value === 'none' ||
    value === 'initial' ||
    value === 'inherit' ||
    value === 'unset' ||
    value === 'transparent' ||
    value === 'currentColor' ||
    value === 'current'
  ) {
    return value
  }

  // Convert underscores back to spaces for multi-word values
  if (value.includes('_')) {
    return value.replace(/_/g, ' ')
  }

  // Handle CSS values with units - they should stay as strings
  if (
    /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|lh|rlh|vi|vb|svh|lvh|dvh|svw|lvw|dvw|deg|grad|rad|turn|s|ms|hz|khz|dpi|dpcm|dppx)$/i.test(
      value,
    )
  ) {
    return value
  }

  // Handle fractional values like 1/2, 2/3, etc.
  if (/^\d+\/\d+$/.test(value)) {
    return value
  }

  return value
}

/**
 * Get the CSS property name from a class prefix, handling both direct mappings and CSS property fallbacks
 */
function getCSSProperty(prefix: string): string | null {
  // First check our explicit mapping
  const mappedProperty = CLASS_TO_PROPERTY_MAP.get(prefix)
  if (mappedProperty) return mappedProperty

  // Check shorthand aliases
  const aliasedProperty = SHORTHAND_ALIASES.get(prefix)
  if (aliasedProperty) return aliasedProperty

  // Fallback: convert kebab-case class names to camelCase CSS properties
  if (prefix.includes('-')) {
    const camelCased = camelCaseProperty(prefix)
    // Validate that it's a real CSS property before returning it
    return isCssProperty(camelCased) ? camelCased : null
  }

  // Return null if we can't map it
  return null
}

/**
 * Parses a single Panda CSS class name and returns the property-value pair
 */
function parseClassName(
  className: string,
): { property: string; value: string | number | Record<string, string | number>; condition?: string } | null {
  try {
    // Check for CSS selector patterns without condition prefix like [&_svg]:w_3
    // OR with conditions like [&_path]:rtl:trf_rotate(-180deg)
    const directSelectorMatch = className.match(/^\[([^\]]+)\]:(.+)$/)
    if (directSelectorMatch) {
      const [, selector, propertyValue] = directSelectorMatch

      // Check if propertyValue contains a condition (e.g., "rtl:trf_rotate(-180deg)")
      const conditionMatch = propertyValue.match(/^([^:]+):(.+)$/)
      if (conditionMatch) {
        const [, conditionKey, nestedPropertyValue] = conditionMatch

        // Convert underscores to spaces in selector
        const normalizedSelector = selector
          .replace(/&quot;/g, '"') // Handle HTML entity quotes
          .replace(/\]_/g, '] ') // Add space after closing bracket
          .replace(/([&])_/g, '$1 ') // Add space after & character
          .replace(/_/g, ' ')

        // Parse the property:value part
        const parts = nestedPropertyValue.split('_')
        if (parts.length < 2) return null

        const prefix = parts[0]
        const value = parts.slice(1).join('_')

        // Get the CSS property name
        const property = getCSSProperty(prefix)
        if (!property) return null

        // Convert kebab-case condition names to camelCase for mapping lookup
        const camelCaseConditionKey = camelCaseProperty(conditionKey)
        const mappedCondition =
          CONDITION_MAP.get(conditionKey) || CONDITION_MAP.get(camelCaseConditionKey) || `_${conditionKey}`

        const parsedValue = parseValue(value)

        return {
          property: normalizedSelector,
          value: { [property]: parsedValue },
          condition: mappedCondition,
        }
      }

      // Convert underscores to spaces in selector (e.g., "&_svg" -> "& svg")
      const normalizedSelector = selector
        .replace(/&quot;/g, '"') // Handle HTML entity quotes
        .replace(/\]_/g, '] ') // Add space after closing bracket
        .replace(/([&])_/g, '$1 ') // Add space after & character
        .replace(/_/g, ' ')

      // Parse the property:value part
      const parts = propertyValue.split('_')
      if (parts.length < 2) return null

      const prefix = parts[0]
      const value = parts.slice(1).join('_')

      // Get the CSS property name
      const property = getCSSProperty(prefix)
      if (!property) return null

      const parsedValue = parseValue(value)

      return {
        property: normalizedSelector,
        value: { [property]: parsedValue },
      }
    }

    // Check for conditional styles - but first handle selector patterns that might look like conditions
    const conditionMatch = className.match(/^([^:]+):(.+)$/)
    let condition: string | undefined
    let baseClassName: string

    if (conditionMatch) {
      const [, conditionKey, rest] = conditionMatch

      // Check if conditionKey is actually a selector pattern (starts with [)
      if (conditionKey.startsWith('[') && conditionKey.endsWith(']')) {
        // This is a selector pattern with condition like [&_path]:rtl:trf_rotate(-180deg)
        const selector = conditionKey.slice(1, -1) // Remove [ and ]

        // Check if rest contains another condition
        const nestedConditionMatch = rest.match(/^([^:]+):(.+)$/)
        if (nestedConditionMatch) {
          const [, nestedConditionKey, nestedPropertyValue] = nestedConditionMatch

          // Convert underscores to spaces in selector, handling data attributes
          const normalizedSelector = selector
            .replace(/&quot;/g, '"') // Handle HTML entity quotes
            .replace(/\]_/g, '] ') // Add space after closing bracket
            .replace(/([&])_/g, '$1 ') // Add space after & character
            .replace(/_/g, ' ')

          // Parse the property:value part
          const parts = nestedPropertyValue.split('_')
          if (parts.length < 2) return null

          const prefix = parts[0]
          const value = parts.slice(1).join('_')

          // Get the CSS property name
          const property = getCSSProperty(prefix)
          if (!property) return null

          // Convert kebab-case condition names to camelCase for mapping lookup
          const camelCaseNestedConditionKey = camelCaseProperty(nestedConditionKey)
          const mappedNestedCondition =
            CONDITION_MAP.get(nestedConditionKey) ||
            CONDITION_MAP.get(camelCaseNestedConditionKey) ||
            `_${nestedConditionKey}`

          const parsedValue = parseValue(value)

          return {
            property: normalizedSelector,
            value: { [property]: parsedValue },
            condition: mappedNestedCondition,
          }
        }

        // This is a direct selector pattern like [&_path]:trf-o_center
        const normalizedSelector = selector
          .replace(/&quot;/g, '"') // Handle HTML entity quotes
          .replace(/\]_/g, '] ') // Add space after closing bracket
          .replace(/([&])_/g, '$1 ') // Add space after & character
          .replace(/_/g, ' ')

        // Parse the property:value part
        const parts = rest.split('_')
        if (parts.length < 2) return null

        const prefix = parts[0]
        const value = parts.slice(1).join('_')

        // Get the CSS property name
        const property = getCSSProperty(prefix)
        if (!property) return null

        const parsedValue = parseValue(value)

        return {
          property: normalizedSelector,
          value: { [property]: parsedValue },
        }
      }

      // Handle CSS selector patterns like motionReduce:[&_.rfm-marquee]:anim_none!
      const selectorMatch = rest.match(/^\[([^\]]+)\]:(.+)$/)
      if (selectorMatch) {
        const [, selector, propertyValue] = selectorMatch

        // Convert underscores to spaces in selector (e.g., "&_.rfm-marquee" -> "& .rfm-marquee")
        const normalizedSelector = selector
          .replace(/&quot;/g, '"') // Handle HTML entity quotes
          .replace(/\]_/g, '] ') // Add space after closing bracket
          .replace(/([&])_/g, '$1 ') // Add space after & character
          .replace(/_/g, ' ')

        // Parse the property:value part
        const parts = propertyValue.split('_')
        if (parts.length < 2) return null

        const prefix = parts[0]
        const value = parts.slice(1).join('_')

        // Get the CSS property name
        const property = getCSSProperty(prefix)
        if (!property) return null

        // Convert kebab-case condition names to camelCase for mapping lookup
        const camelCaseConditionKey = camelCaseProperty(conditionKey)
        const mappedCondition =
          CONDITION_MAP.get(conditionKey) || CONDITION_MAP.get(camelCaseConditionKey) || conditionKey

        const parsedValue = parseValue(value)

        return {
          property: normalizedSelector,
          value: { [property]: parsedValue },
          condition: mappedCondition,
        }
      }

      // Convert kebab-case condition names to camelCase for mapping lookup
      const camelCaseConditionKey = camelCaseProperty(conditionKey)

      // Try both the original key and camelCase version
      condition = CONDITION_MAP.get(conditionKey) || CONDITION_MAP.get(camelCaseConditionKey) || conditionKey
      baseClassName = rest
    } else {
      baseClassName = className
    }

    // Split class name into prefix and value (e.g., "fs_2rem" -> ["fs", "2rem"])
    const parts = baseClassName.split('_')
    if (parts.length < 2) return null

    const prefix = parts[0]
    const value = parts.slice(1).join('_') // Rejoin in case value contains underscores

    // Get the CSS property name
    const property = getCSSProperty(prefix)
    if (!property) return null

    const parsedValue = parseValue(value)

    return { property, value: parsedValue, condition }
  } catch (error) {
    console.warn(`Failed to parse class name: ${className}`, error)
    return null
  }
}

/**
 * Converts a classList string back to a Panda CSS style object
 * Handles real-world class names without needing prior encoding
 *
 * @param classList - Space-separated class names (e.g., "fs_2rem sm:fs_3rem ls_tight")
 * @returns Style object representing the original styles
 *
 * @example
 * reverseSplitter("fs_2.5rem sm:fs_3rem ls_tight fw_bold lh_1.2 max-w_40rem md:max-w_unset")
 * // Returns:
 * // {
 * //   fontSize: "2.5rem",
 * //   sm: { fontSize: "3rem" },
 * //   letterSpacing: "tight",
 * //   fontWeight: "bold",
 * //   lineHeight: 1.2,
 * //   maxWidth: "40rem",
 * //   md: { maxWidth: "unset" }
 * // }
 */
export function reverseSplitter(classList: string): Record<string, any> {
  const classNames = classList.split(/\s+/).filter(Boolean)
  const styleObject: Record<string, any> = {}

  for (const className of classNames) {
    const parsed = parseClassName(className)
    if (!parsed) continue

    const { property, value, condition } = parsed

    if (condition) {
      // Handle conditional styles
      if (!styleObject[condition]) {
        styleObject[condition] = {}
      }

      // Check if this is a CSS selector pattern (value is an object)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // This is a CSS selector pattern like [&_.rfm-marquee]:anim_none!
        if (!styleObject[condition][property]) {
          styleObject[condition][property] = {}
        }
        // Merge the properties
        Object.assign(styleObject[condition][property], value)
      } else {
        // Regular conditional style
        styleObject[condition][property] = value
      }
    } else {
      // Handle base styles and CSS selector patterns without conditions
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // This is a CSS selector pattern like [&_svg]:w_3
        if (!styleObject[property]) {
          styleObject[property] = {}
        }
        // Merge the properties
        Object.assign(styleObject[property], value)
      } else {
        // Regular base style
        styleObject[property] = value
      }
    }
  }

  return styleObject
}
