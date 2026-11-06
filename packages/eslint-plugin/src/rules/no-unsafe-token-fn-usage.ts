import type { FileInspectionResult, StyleEntryRef, StyleValueSpanRef, TokenRefSite } from '@pandacss/compiler'
import {
  type Inspect,
  type ReportDescriptor,
  type RuleContextWithReport,
  type RuleModuleLike,
  type SourceIndex,
  createSourceIndex,
  findTokenCall,
  getSourceText,
  unwrapExpressionContainer,
  within,
} from './shared'

export const noUnsafeTokenFnUsageRuleName = 'no-unsafe-token-fn-usage'

export interface NoUnsafeTokenFnUsageRuleOptions {
  inspect: Inspect
  resolveValue: (prop: string, value: string) => string | undefined
}

const TOKEN_REFERENCE = /^(?:token\(\s*([^,()\s]+)\s*\)|\{\s*([^{}\s]+)\s*\})$/

function stringLiteral(text: string): { quote: string; body: string } | undefined {
  const quote = text[0]
  if ((quote === "'" || quote === '"' || quote === '`') && text.length > 1 && text.endsWith(quote)) {
    return { quote, body: text.slice(1, -1) }
  }
}

function referencePath(value: string): string | undefined {
  let text = value.trim()
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1).trim()
  const match = TOKEN_REFERENCE.exec(text)
  return match ? match[1] ?? match[2] : undefined
}

interface Finding {
  messageId: 'reference' | 'call' | 'varCall'
  replacement: string
  autofix: boolean
}

function analyze(
  source: SourceIndex,
  entry: StyleEntryRef,
  leaf: StyleValueSpanRef,
  tokenRefs: readonly TokenRefSite[],
  resolveValue: NoUnsafeTokenFnUsageRuleOptions['resolveValue'],
): Finding | undefined {
  const call = findTokenCall(source, leaf, tokenRefs)
  const path = call ? call.path : referencePath(leaf.value)
  if (!path) return

  if (!call) {
    const literal = stringLiteral(unwrapExpressionContainer(source.slice(leaf.span)))
    if (!literal || literal.body !== leaf.value) return
    const ref = tokenRefs.find((site) => within(site.span, leaf.span))
    if (!ref?.resolved) return
  } else if (!call.resolved) {
    return
  }

  const name = path.slice(path.indexOf('.') + 1)
  const reference = `{${path}}`
  const expected = resolveValue(entry.name, reference)
  const sameCss = path.includes('.') && expected !== undefined && resolveValue(entry.name, name) === expected

  if (!call) return sameCss ? { messageId: 'reference', replacement: name, autofix: true } : undefined
  return {
    messageId: call.isVar ? 'varCall' : 'call',
    replacement: sameCss ? name : reference,
    autofix: false,
  }
}

function replacementText(source: SourceIndex, entry: StyleEntryRef, leaf: StyleValueSpanRef, value: string): string {
  const text = source.slice(leaf.span)
  const literal = stringLiteral(text)
  if (literal) return `${literal.quote}${value}${literal.quote}`
  return entry.syntax === 'jsx-prop' && text.startsWith('{') ? `"${value}"` : `'${value}'`
}

function report(
  context: RuleContextWithReport,
  inspection: FileInspectionResult,
  resolveValue: NoUnsafeTokenFnUsageRuleOptions['resolveValue'],
): void {
  const text = getSourceText(context)
  if (!text) return
  const source = createSourceIndex(text)

  for (const entry of inspection.styleEntries) {
    if (entry.kind !== 'utility') continue

    for (const leaf of entry.valueSpans ?? []) {
      const finding = analyze(source, entry, leaf, inspection.tokenRefs, resolveValue)
      if (!finding) continue

      const start = source.index(leaf.span.start)
      const end = source.index(leaf.span.end)
      const range: [number, number] = [start, end]
      const text = replacementText(source, entry, leaf, finding.replacement)
      const fix: NonNullable<ReportDescriptor['fix']> = (fixer) => fixer.replaceTextRange(range, text)

      context.report({
        messageId: finding.messageId,
        data: { replacement: finding.replacement },
        loc: { start: source.loc(start), end: source.loc(end) },
        ...(finding.autofix ? { fix } : {}),
        suggest: [{ desc: `Use '${finding.replacement}'`, fix }],
      })
    }
  }
}

export function createNoUnsafeTokenFnUsageRule(options: NoUnsafeTokenFnUsageRuleOptions): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: 'Prefer a plain token name over a token reference or token() call in a style value.' },
      schema: [],
      messages: {
        reference: "This token reference isn't needed. Use '{{replacement}}'.",
        call: "token() writes the raw value into the CSS, so theme changes don't reach it. Use '{{replacement}}'.",
        varCall: "token.var() isn't needed in a style value. Use '{{replacement}}'.",
      },
      fixable: 'code',
      hasSuggestions: true,
    },
    create(context) {
      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return
          report(context, inspection, options.resolveValue)
        },
      }
    },
  }
}
