import { hypenateProperty } from '@pandacss/shared'
import type { Dict } from '@pandacss/types'

// adapted from https://github.com/stitchesjs/stitches/blob/50fd8a1adc6360340fe348a8b3ebc8b06d38e230/packages/stringify/src/index.js

interface StringifyContext {
  property: string
  value: string | string[] | number | number[] | (string | number)[]
  style: Dict
  selectors: string[]
}

/* Grab object prototype to compare in the loop */
const toString = Object.prototype.toString

/** Returns a string of CSS from an object of CSS. */
export function stringify(
  /** Style object defintion. */
  value: Dict,
) {
  /** Set used to manage the opened and closed state of rules. */
  const used = new WeakSet()

  const write = (
    cssText: string,
    selectors: StringifyContext['selectors'],
    conditions: String[],
    name: string,
    data: string | number,
    isAtRuleLike: boolean,
    isVariableLike: boolean,
  ) => {
    // Add conditions
    for (let i = 0; i < conditions.length; ++i) {
      if (!used.has(conditions[i])) {
        used.add(conditions[i])
        cssText += `${conditions[i]} {`
      }
    }

    // Then selectors
    if (selectors.length && !used.has(selectors)) {
      used.add(selectors)
      cssText += `${selectors} {`
    }

    // Format property
    if (isAtRuleLike) {
      name = `${name} `
    } else if (isVariableLike) {
      name = `${name}: `
    } else {
      name = `${hypenateProperty(name)}: `
    }

    // Add it to the CSS string
    cssText += `${name + String(data)};\n`

    return cssText
  }

  const parse = (style: Dict, selectors: Array<string>, conditions: String[]) => {
    let cssText = ''

    for (const name in style) {
      const isAtRuleLike = name[0] === '@'
      const isVariableLike = (!isAtRuleLike && name === '--') || name[0] === '$'
      const rules = (isAtRuleLike && Array.isArray(style[name]) ? style[name] : [style[name]]) as Array<string | Dict>

      for (const data of rules) {
        const isObjectLike = typeof data === 'object' && data && data.toString === toString

        // Declaration rule (no nested rules), just property and value
        if (!isObjectLike) {
          cssText = write(cssText, selectors, conditions, name, data as string | number, isAtRuleLike, isVariableLike)
          continue
        }

        // Closing selector block
        if (used.has(selectors)) {
          used.delete(selectors)

          cssText += '}'
        }

        // This ensures a unique reference with `String("xxx")` even if the same string "xxx" is used multiple times
        const usedName = Object(name)

        let nextSelectors: typeof selectors

        // Nested condition
        if (isAtRuleLike) {
          nextSelectors = selectors
          // TODO rm recursion ?
          cssText += parse(data, nextSelectors, conditions.concat(usedName))
        } else {
          // Nested selector rule
          const nestedSelectors = parseSelectors(name)
          nextSelectors = selectors.length
            ? getResolvedSelectors(selectors as string[], nestedSelectors)
            : nestedSelectors
          // TODO rm recursion ?
          cssText += parse(data, nextSelectors, conditions)
        }

        // Closing nested condition block
        if (used.has(usedName)) {
          used.delete(usedName)
          cssText += '}\n'
        }

        // Closing nested selector block
        if (used.has(nextSelectors)) {
          used.delete(nextSelectors)
          cssText += '}\n'
        }
      }
    }

    return cssText
  }

  return parse(value, [], [])
}

/**
 * Returns a list of separated selectors from a selector string.
 * @example
 * parseSelectors('a, button') // ['a', 'button']
 * parseSelectors('.switch:is(:checked, [data-checked]).dark, .dark .switch:is(:checked, [data-checked])') // ['.switch:is(:checked, [data-checked]).dark', '.dark .switch:is(:checked, [data-checked])']
 * parseSelectors('&:is(:disabled, [disabled], [data-disabled]), .another') // [':is(:disabled, [disabled], [data-disabled])', '.another']
 */
function parseSelectors(selector: string): string[] {
  const result = [] as string[]
  let parenCount = 0
  let currentSelector = ''
  let inEscape = false

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]

    if (char === '\\' && !inEscape) {
      inEscape = true
      currentSelector += char
      continue
    }

    if (inEscape) {
      inEscape = false
      currentSelector += char
      continue
    }

    if (char === '(') {
      parenCount++
    } else if (char === ')') {
      parenCount--
    }

    if (char === ',' && parenCount === 0) {
      result.push(currentSelector.trim())
      currentSelector = ''
    } else {
      currentSelector += char
    }
  }

  if (currentSelector) {
    result.push(currentSelector.trim())
  }

  return result
}

const parentSelectorRegex = /&/g
const descendantSelectorRegex = /[ +>|~]/g
const surroundedRegex = /&.*&/g

/**
 * Returns selectors resolved from parent selectors and nested selectors.
 * @example
 * getResolvedSelectors(['a', 'button'], ['&:hover', '&:focus']) // ['a:hover', 'a:focus', 'button:hover', 'button:focus']
 * getResolvedSelectors(['.switch:is(:checked, [data-checked]).dark, .dark .switch:is(:checked, [data-checked])'], ['&:hover', '&:focus']) // ['.switch:is(:checked, [data-checked]).dark:hover', '.switch:is(:checked, [data-checked]).dark:focus', '.dark .switch:is(:checked, [data-checked]):hover', '.dark .switch:is(:checked, [data-checked]):focus']
 *
 */
const getResolvedSelectors = (
  /** Parent selectors (e.g. `["a", "button"]`). */
  parentSelectors: string[],
  /** Nested selectors (e.g. `["&:hover", "&:focus"]`). */
  nestedSelectors: string[],
) => {
  const resolved = [] as string[]

  parentSelectors.forEach((parentSelector) => {
    resolved.push(
      ...nestedSelectors.map((selector) => {
        if (!selector.includes('&')) return parentSelector + ' ' + selector

        return selector.replace(
          parentSelectorRegex,
          descendantSelectorRegex.test(parentSelector) && surroundedRegex.test(selector)
            ? `:is(${parentSelector})`
            : parentSelector,
        )
      }),
    )
  })

  return resolved
}
