import { StyleEncoder, getEntryFromHash } from '@pandacss/core'
import type { PandaContext } from '@pandacss/node'
import type { Dict } from '@pandacss/types'

const importantRegex = /\s*!(important)?/i

function isImportant(value: string | number | boolean): boolean {
  return typeof value === 'string' ? importantRegex.test(value) : false
}

function withoutImportant(value: string | number | boolean): string | number | boolean {
  return typeof value === 'string' ? value.replace(importantRegex, '').trim() : value
}

/**
 * Resolve an array of style objects to a single className string.
 * Uses a fresh encoder to avoid polluting the global state.
 *
 * Returns DOM classNames (unescaped), e.g. 'hover:text_red.500 mt_4'
 */
export function resolveStylesToClassNames(ctx: PandaContext, data: Dict[]): string {
  const encoder = ctx.encoder.clone()
  data.forEach((obj) => encoder.processAtomic(obj))

  return buildDomClassNames(encoder, ctx)
}

/**
 * Resolve pattern props to style objects, then to classNames.
 */
export function resolvePatternToClassNames(ctx: PandaContext, patternName: string, data: Dict[]): string {
  const encoder = ctx.encoder.clone()

  data.forEach((props) => {
    const styleProps = ctx.patterns.transform(patternName, props)
    encoder.processStyleProps(styleProps)
  })

  return buildDomClassNames(encoder, ctx)
}

/**
 * Build DOM className strings from encoder hashes.
 * Unlike StyleDecoder.formatSelector which escapes for CSS selectors,
 * this produces unescaped classNames for use in element.className / JSX.
 */
function buildDomClassNames(encoder: StyleEncoder, ctx: PandaContext): string {
  const classNames: string[] = []

  encoder.atomic.forEach((hash) => {
    const entry = getEntryFromHash(hash)

    const transformed = ctx.utility.transform(entry.prop, withoutImportant(entry.value) as string)
    if (!transformed.className) return

    const formatted = ctx.utility.formatClassName(transformed.className)
    const important = isImportant(entry.value)

    if (entry.cond) {
      const parts = entry.cond.split(StyleEncoder.conditionSeparator)
      const conds = ctx.conditions.finalize(parts)

      if (ctx.hash.className) {
        conds.push(formatted)
        let result = ctx.utility.formatClassName(ctx.utility.toHash(conds, ctx.utility.defaultHashFn))
        if (important) result += '!'
        classNames.push(result)
      } else {
        conds.push(formatted)
        let result = conds.join(':')
        if (important) result += '!'
        classNames.push(result)
      }
    } else {
      let result = formatted
      if (important) result += '!'
      classNames.push(result)
    }
  })

  return classNames.join(' ')
}
