import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { ResultItem } from '@pandacss/types'
import { buildDomClassNames } from './resolver'
import { findCallExpression } from './find-call'
import { boxHasConditionals } from './resolve-conditional'

export function inlineRecipeCall(ms: MagicString, item: ResultItem, recipeName: string, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  // Bail if variant values contain conditionals — can't flatten correctly
  if (boxHasConditionals(item.box)) return false

  // Skip slot recipes — they return objects, not strings
  if (ctx.recipes.isSlotRecipe(recipeName)) return false

  const recipeNode = ctx.recipes.getRecipe(recipeName)
  if (!recipeNode) return false

  const config = ctx.recipes.getConfig(recipeName)
  if (!config) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  const userVariants = (item.data[0] ?? {}) as Record<string, string>
  const computedVariants = Object.assign({}, config.defaultVariants, userVariants)

  const classNames: string[] = []

  // Base className is always included
  const baseClassName = recipeNode.className
  classNames.push(baseClassName)

  // Add variant classNames: `className--variantKey_variantValue`
  const separator = ctx.utility.separator ?? '_'
  for (const [variantKey, variantValue] of Object.entries(computedVariants)) {
    if (variantValue == null) continue
    const variants = config.variants?.[variantKey]
    if (!variants || !(String(variantValue) in variants)) continue
    classNames.push(`${baseClassName}--${variantKey}${separator}${variantValue}`)
  }

  // Add compound variant atomic classNames
  if (config.compoundVariants) {
    for (const cv of config.compoundVariants) {
      if (!cv?.css) continue

      // Check if all conditions match
      const matches = Object.entries(cv).every(([key, value]) => {
        if (key === 'css') return true
        return computedVariants[key] === value
      })

      if (matches) {
        const encoder = ctx.encoder.clone()
        encoder.processAtomic(cv.css)
        const atomicClasses = buildDomClassNames(encoder, ctx)
        if (atomicClasses) classNames.push(atomicClasses)
      }
    }
  }

  const className = classNames.join(' ')
  ms.overwrite(callNode.getStart(), callNode.getEnd(), JSON.stringify(className))
  return true
}
