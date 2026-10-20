import { createUsageReport, type FileInspectionResult, type UsageReport } from '@pandacss/compiler-shared'
import type { InspectingCompiler } from '~/utils/analyze-compiler'

interface SpecUtilities {
  utilities: {
    properties: Record<string, { cssProperty?: string; tokenCategory?: string }>
    shorthands: Record<string, string>
  }
}

interface Located {
  prop: string
  value: string
  line: number
  /** Character offsets into the source; -1 when only the line is known. */
  from: number
  to: number
}

export type Finding =
  | (Located & { kind: 'token'; path: string })
  | (Located & { kind: 'unknown'; category: string; suggestion?: string })
  | (Located & { kind: 'raw'; category: string; match?: string })

export interface SnippetInspection {
  findings: Finding[]
  report: UsageReport
  file: Omit<FileInspectionResult, 'path'>
}

const PATH = 'playground.tsx'

/** Compiler spans are UTF-8 byte offsets; the editor counts UTF-16 code units. */
export function byteToCharIndex(source: string): (byte: number) => number {
  if (!/[^\x00-\x7f]/.test(source)) return (byte) => byte
  const encoder = new TextEncoder()
  const offsets: number[] = []
  let bytes = 0
  for (let i = 0; i < source.length; i++) {
    offsets.push(bytes)
    const code = source.codePointAt(i)!
    bytes += encoder.encode(String.fromCodePoint(code)).length
    if (code > 0xffff) {
      offsets.push(bytes)
      i++
    }
  }
  offsets.push(bytes)
  return (byte) => {
    let lo = 0
    let hi = offsets.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (offsets[mid] < byte) lo = mid + 1
      else hi = mid
    }
    return lo
  }
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]
      row[j] = a[i - 1] === b[j - 1] ? previous : 1 + Math.min(previous, row[j], row[j - 1])
      previous = current
    }
  }
  return row[b.length]
}

/** The compiler matches by value; this is the one name-based check, for misspelled token names. */
export function nearestTokenName(value: string, names: Iterable<string>): string | undefined {
  let best: string | undefined
  let bestScore = Infinity
  for (const name of names) {
    const score = editDistance(value, name)
    if (score < bestScore) {
      best = name
      bestScore = score
    }
  }
  return bestScore <= Math.max(2, Math.floor(value.length / 3)) ? best : undefined
}

export const canonicalProp = (spec: SpecUtilities, prop: string) => spec.utilities.shorthands[prop] ?? prop

export const tokenCategoryOf = (spec: SpecUtilities, prop: string) =>
  spec.utilities.properties[canonicalProp(spec, prop)]?.tokenCategory

const kebab = (property: string) => property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const isValidCss = (cssProperty: string | undefined, value: string) =>
  !!cssProperty && typeof CSS !== 'undefined' && CSS.supports(kebab(cssProperty), value)

function lineIndex(source: string): (offset: number) => number {
  const starts = [0]
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') starts.push(i + 1)
  return (offset) => {
    let lo = 0
    let hi = starts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (starts[mid] <= offset) lo = mid
      else hi = mid - 1
    }
    return lo + 1
  }
}

export function inspectSource(
  compiler: InspectingCompiler,
  path: string,
  source: string,
  tokenNames: (category: string) => string[],
) {
  const file = compiler.inspectFileSource(path, source)
  const spec = compiler.spec() as SpecUtilities
  const toChar = byteToCharIndex(source)
  const toLine = lineIndex(source)
  const findings: Finding[] = []

  for (const entry of file.styleEntries) {
    if (entry.kind !== 'utility' || entry.origin === 'generated') continue
    const prop = canonicalProp(spec, entry.canonicalName ?? entry.name)
    const property = spec.utilities.properties[prop]
    const category = property?.tokenCategory
    for (const span of entry.valueSpans ?? []) {
      const from = toChar(span.span.start)
      const to = toChar(span.span.end)
      const line = toLine(from)
      if (span.token) {
        findings.push({ kind: 'token', prop, value: span.value, path: span.token.path, line, from, to })
        continue
      }
      if (!category || !span.value) continue
      // The published compiler drops the token link for values from a theme() function, like margin's.
      if (tokenNames(category).includes(span.value)) {
        findings.push({ kind: 'token', prop, value: span.value, path: `${category}.${span.value}`, line, from, to })
        continue
      }
      const match = compiler.suggestTokens(prop, span.value)[0]?.token
      if (match || isValidCss(property.cssProperty, span.value)) {
        findings.push({ kind: 'raw', prop, value: span.value, category, match, line, from, to })
      } else {
        const suggestion = nearestTokenName(span.value, tokenNames(category))
        findings.push({ kind: 'unknown', prop, value: span.value, category, suggestion, line, from, to })
      }
    }
  }

  return { findings, file }
}

export function inspectSnippet(
  compiler: InspectingCompiler,
  source: string,
  tokenNames: (category: string) => string[],
): SnippetInspection {
  const { findings, file } = inspectSource(compiler, PATH, source, tokenNames)
  const report = createUsageReport(
    { sourceCount: 1, files: [{ ...file, path: PATH }] },
    {
      scope: 'tokens',
      spec: compiler.spec() as never,
      suggestTokens: (prop, value) => compiler.suggestTokens(prop, value),
    },
  )

  return { findings, report, file }
}
