import type { UsageReport } from '@pandacss/compiler-shared'
import type { InspectingCompiler } from './analyze-compiler'
import type { DesignSystemIndex } from './design-system'
import { inspectSource, lineStarts, nearestTokenName, type Finding } from './token-inspection'

export interface ScanFile {
  path: string
  /** Present when Studio read the file itself; a CLI report only has lines. */
  source?: string
  /** Where the file lives on disk, as a CLI report records it. */
  absPath?: string
  findings: Finding[]
}

export interface ProjectScan {
  origin: 'folder' | 'report'
  scannedAt: number
  sourceCount: number
  files: ScanFile[]
}

export type Issue = Exclude<Finding, { kind: 'token' }>

export const isIssue = (finding: Finding): finding is Issue => finding.kind !== 'token'

/** Drop the folders every path shares, so the tree starts where the project does. */
export function trimCommonRoot(paths: string[]): (path: string) => string {
  if (!paths.length) return (path) => path
  const split = paths.map((p) => p.split('/').slice(0, -1))
  let depth = 0
  while (split.every((parts) => parts.length > depth && parts[depth] === split[0][depth])) depth++
  return (path) => path.split('/').slice(depth).join('/')
}

export function scanSources(
  compiler: InspectingCompiler,
  sources: { path: string; text: string }[],
  tokenNames: (category: string) => string[],
): ProjectScan {
  const trim = trimCommonRoot(sources.map((s) => s.path))
  const files: ScanFile[] = []
  for (const { path, text } of sources) {
    const { findings } = inspectSource(compiler, path, text, tokenNames)
    if (findings.length) files.push({ path: trim(path), source: text, findings })
  }
  return { origin: 'folder', scannedAt: Date.now(), sourceCount: sources.length, files: sortFiles(files) }
}

export function isUsageReport(value: unknown): value is UsageReport {
  const facts = (value as UsageReport | null)?.facts
  return !!facts && Array.isArray(facts.files) && Array.isArray(facts.tokenUsages)
}

export function scanFromReport(report: UsageReport, tokenNames: (category: string) => string[]): ProjectScan {
  const { facts } = report
  const byFile = new Map<number, Finding[]>()
  const add = (fileId: number, finding: Finding) => {
    const list = byFile.get(fileId) ?? []
    list.push(finding)
    byFile.set(fileId, list)
  }

  const tokens = new Map(facts.tokens.map((t) => [t.id, t]))
  for (const use of facts.tokenUsages) {
    const token = tokens.get(use.tokenId)
    if (!token) continue
    const value = token.path.slice(token.category.length + 1)
    const at = { prop: token.category, value, line: use.line, column: use.column, from: -1, to: -1 }
    add(
      use.fileId,
      token.configured
        ? { ...at, kind: 'token', path: token.path }
        : {
            ...at,
            kind: 'unknown',
            category: token.category,
            suggestion: nearestTokenName(value, tokenNames(token.category)),
          },
    )
  }

  const raws = new Map(facts.rawValues.map((r) => [r.id, r]))
  const suggestions = new Map<number, string>()
  for (const s of facts.rawValueSuggestions) if (!suggestions.has(s.rawValueId)) suggestions.set(s.rawValueId, s.token)
  for (const use of facts.rawValueUsages) {
    const raw = raws.get(use.rawValueId)
    if (!raw) continue
    add(use.fileId, {
      kind: 'raw',
      prop: raw.prop,
      value: raw.value,
      category: raw.category,
      match: suggestions.get(raw.id),
      line: use.line,
      column: use.column,
      from: -1,
      to: -1,
    })
  }

  const paths = new Map(facts.files.map((f) => [f.id, f.path]))
  const trim = trimCommonRoot([...paths.values()])
  const files = [...byFile].flatMap(([id, findings]) => {
    const path = paths.get(id)
    return path ? [{ path: trim(path), absPath: path, findings: findings.toSorted((a, b) => a.line - b.line) }] : []
  })
  return { origin: 'report', scannedAt: Date.now(), sourceCount: report.sourceCount, files: sortFiles(files) }
}

/**
 * Give report files their code without re-scanning: findings stay the CLI's,
 * placed on the value they name, or on the whole line when it can't be found.
 */
export function attachSources(scan: ProjectScan, sources: { path: string; text: string }[]): ProjectScan {
  const files = scan.files.map((file) => {
    const text = findSource(file.absPath ?? file.path, sources)
    if (text == null) return file
    const lines = lineStarts(text)
    const findings = file.findings.map((finding) => {
      const start = lines[finding.line - 1]
      if (start == null) return finding
      const end = lines[finding.line] ?? text.length + 1
      const at = text.slice(start, end - 1).indexOf(finding.value)
      return at < 0
        ? { ...finding, from: start, to: end - 1 }
        : { ...finding, from: start + at, to: start + at + finding.value.length }
    })
    return { ...file, source: text, findings }
  })
  return { ...scan, files }
}

/** The source whose path shares the most trailing folders with `path`, the file name included. */
function findSource(path: string, sources: { path: string; text: string }[]): string | undefined {
  const want = path.split('/').reverse()
  let best: { text: string; score: number } | undefined
  for (const source of sources) {
    const have = source.path.split('/').reverse()
    let score = 0
    while (score < want.length && score < have.length && want[score] === have[score]) score++
    if (score && (!best || score > best.score)) best = { text: source.text, score }
  }
  return best?.text
}

const sortFiles = (files: ScanFile[]) => files.toSorted((a, b) => a.path.localeCompare(b.path))

export interface CategoryCoverage {
  type: string
  tokens: { name: string; uses: number }[]
  used: number
}

export interface ScanSummary {
  categories: CategoryCoverage[]
  top: { path: string; category: string; name: string; uses: number }[]
  issues: (Issue & { file: string })[]
  used: number
  total: number
  unknown: number
  raw: number
}

export function summarizeScan(scan: ProjectScan, ds: DesignSystemIndex, categories: string[]): ScanSummary {
  const uses = new Map<string, number>()
  const issues: ScanSummary['issues'] = []
  for (const file of scan.files) {
    for (const finding of file.findings) {
      if (finding.kind === 'token') uses.set(finding.path, (uses.get(finding.path) ?? 0) + 1)
      else issues.push({ ...finding, file: file.path })
    }
  }

  const coverage = categories.map((type) => {
    const tokens = ds.view(type).map((t) => ({ name: t.name, uses: uses.get(`${type}.${t.name}`) ?? 0 }))
    return { type, tokens, used: tokens.filter((t) => t.uses).length }
  })

  const top = [...uses]
    .map(([path, count]) => {
      const dot = path.indexOf('.')
      return { path, category: path.slice(0, dot), name: path.slice(dot + 1), uses: count }
    })
    .toSorted((a, b) => b.uses - a.uses || a.path.localeCompare(b.path))
    .slice(0, 10)

  return {
    categories: coverage,
    top,
    issues,
    used: coverage.reduce((n, c) => n + c.used, 0),
    total: coverage.reduce((n, c) => n + c.tokens.length, 0),
    unknown: issues.filter((i) => i.kind === 'unknown').length,
    raw: issues.filter((i) => i.kind === 'raw').length,
  }
}

export interface TreeNode {
  name: string
  path: string
  file?: ScanFile
  issues: number
  children: TreeNode[]
}

export function buildTree(files: ScanFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', issues: 0, children: [] }
  for (const file of files) {
    const parts = file.path.split('/')
    const issues = file.findings.filter(isIssue).length
    let node = root
    node.issues += issues
    parts.forEach((name, i) => {
      const path = parts.slice(0, i + 1).join('/')
      let child = node.children.find((c) => c.name === name)
      if (!child) {
        child = { name, path, issues: 0, children: [] }
        node.children.push(child)
      }
      child.issues += issues
      if (i === parts.length - 1) child.file = file
      node = child
    })
  }
  const order = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map((n) => ({ ...n, children: order(n.children) }))
      .toSorted((a, b) => Number(!!a.file) - Number(!!b.file) || a.name.localeCompare(b.name))
  return order(root.children)
}
