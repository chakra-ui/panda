import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { Dict, ResultItem } from '@pandacss/types'
import { SyntaxKind } from 'ts-morph'
import { findCallExpression } from './find-call'
import { generateCvaCodeFromConfig } from './cva'
import { SVA_HELPER_ID } from './runtime'

interface SvaConfig {
  slots?: string[]
  base?: Record<string, Dict>
  variants?: Record<string, Record<string, Record<string, Dict>>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<Dict & { css: Record<string, Dict> }>
}

export function inlineSvaCall(ms: MagicString, item: ResultItem, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  const config = item.data[0] as SvaConfig | undefined
  if (!config || !config.slots?.length) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  // Bail on sva.raw() — returns the raw config, not a function
  const expr = callNode.getExpression()
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) return false

  const code = generateSvaCode(config, ctx)
  if (!code) return false

  ms.overwrite(callNode.getStart(), callNode.getEnd(), code)
  return true
}

/**
 * Decompose a slot recipe config into per-slot cva configs,
 * resolve each to classNames, and generate an __sva(...) call.
 */
function generateSvaCode(config: SvaConfig, ctx: PandaContext): string | undefined {
  const slots = config.slots ?? []

  // Decompose into per-slot cva configs (mirrors getSlotRecipes from @pandacss/shared)
  const slotConfigs: Record<
    string,
    {
      base: Dict
      variants: Record<string, Record<string, Dict>>
      defaultVariants: Record<string, string>
      compoundVariants: Array<Dict & { css: Dict }>
    }
  > = {}

  for (const slot of slots) {
    slotConfigs[slot] = {
      base: config.base?.[slot] ?? {},
      variants: {},
      defaultVariants: config.defaultVariants ?? {},
      compoundVariants: getSlotCompoundVariants(config.compoundVariants ?? [], slot),
    }
  }

  // Distribute variants across slots
  for (const [variantKey, variantValues] of Object.entries(config.variants ?? {})) {
    for (const [valueName, slotStyles] of Object.entries(variantValues)) {
      for (const slot of slots) {
        slotConfigs[slot].variants[variantKey] ??= {}
        slotConfigs[slot].variants[variantKey][valueName] = slotStyles[slot] ?? {}
      }
    }
  }

  // Generate __cva call for each slot
  const slotEntries: string[] = []
  for (const slot of slots) {
    const cvaCode = generateCvaCodeFromConfig(slotConfigs[slot], ctx)
    if (!cvaCode) return undefined
    slotEntries.push(`${JSON.stringify(slot)}: ${cvaCode}`)
  }

  // Build variantMap
  const variantMap: Record<string, string[]> = {}
  for (const [key, values] of Object.entries(config.variants ?? {})) {
    variantMap[key] = Object.keys(values)
  }

  return `${SVA_HELPER_ID}({${slotEntries.join(', ')}}, ${JSON.stringify(variantMap)})`
}

function getSlotCompoundVariants(
  compoundVariants: Array<Dict & { css: Record<string, Dict> }>,
  slot: string,
): Array<Dict & { css: Dict }> {
  return compoundVariants.filter((cv) => cv.css?.[slot]).map((cv) => ({ ...cv, css: cv.css[slot] }))
}
