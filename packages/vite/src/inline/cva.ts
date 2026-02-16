import type MagicString from 'magic-string'
import type { PandaContext } from '@pandacss/node'
import type { Dict, ResultItem } from '@pandacss/types'
import { SyntaxKind } from 'ts-morph'
import { resolveStylesToClassNames } from './resolver'
import { findCallExpression } from './find-call'
import { CVA_HELPER_ID } from './runtime'

interface CvaConfig {
  base?: Dict
  variants?: Record<string, Record<string, Dict>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<Dict & { css: Dict }>
}

interface ResolvedCva {
  base: string
  variants: Record<string, Record<string, string>>
  defaultVariants: Record<string, string>
  compoundVariants: Array<[Record<string, string>, string]>
}

export function inlineCvaCall(ms: MagicString, item: ResultItem, ctx: PandaContext): boolean {
  if (!item.box || !item.data.length) return false

  const config = item.data[0] as CvaConfig | undefined
  if (!config) return false

  const callNode = findCallExpression(item.box.getNode())
  if (!callNode) return false

  // Bail on cva.raw() — returns the raw config, not a function
  const expr = callNode.getExpression()
  if (expr.getKind() === SyntaxKind.PropertyAccessExpression) return false

  const resolved = resolveCvaConfig(config, ctx)
  if (!resolved) return false

  const code = generateCvaCode(resolved)
  ms.overwrite(callNode.getStart(), callNode.getEnd(), code)
  return true
}

function resolveCvaConfig(config: CvaConfig, ctx: PandaContext): ResolvedCva | undefined {
  const base = config.base ? resolveStylesToClassNames(ctx, [config.base]) : ''

  const variants: Record<string, Record<string, string>> = {}

  for (const [variantKey, variantValues] of Object.entries(config.variants ?? {})) {
    variants[variantKey] = {}
    for (const [valueName, styles] of Object.entries(variantValues)) {
      variants[variantKey][valueName] = resolveStylesToClassNames(ctx, [styles])
    }
  }

  const compoundVariants: ResolvedCva['compoundVariants'] = []
  for (const cv of config.compoundVariants ?? []) {
    const { css: cvCss, ...conditions } = cv
    if (!cvCss) continue
    const className = resolveStylesToClassNames(ctx, [cvCss])
    if (className) {
      compoundVariants.push([conditions as Record<string, string>, className])
    }
  }

  return {
    base,
    variants,
    defaultVariants: config.defaultVariants ?? {},
    compoundVariants,
  }
}

/**
 * Generate a __cva(...) call expression string from pre-resolved data.
 *
 * __cva(base, variants, defaultVariants, compoundVariants)
 */
function generateCvaCode(resolved: ResolvedCva): string {
  const base = JSON.stringify(resolved.base)
  const variants = JSON.stringify(resolved.variants)

  const dv = Object.keys(resolved.defaultVariants).length > 0 ? JSON.stringify(resolved.defaultVariants) : 'null'

  const cv = resolved.compoundVariants.length > 0 ? JSON.stringify(resolved.compoundVariants) : 'null'

  return `${CVA_HELPER_ID}(${base}, ${variants}, ${dv}, ${cv})`
}

/**
 * Generate a __cva(...) call for a slot-decomposed recipe config.
 * Used by sva.ts for each slot.
 */
export function generateCvaCodeFromConfig(config: CvaConfig, ctx: PandaContext): string | undefined {
  const resolved = resolveCvaConfig(config, ctx)
  if (!resolved) return undefined
  return generateCvaCode(resolved)
}
