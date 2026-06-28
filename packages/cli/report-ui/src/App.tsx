import { useMemo, useState } from 'preact/hooks'
import type { UsageReport } from '@pandacss/compiler-shared'

type Tab = 'tokens' | 'recipes' | 'raw values' | 'files'
type CellKind = 'text' | 'code' | 'badge' | 'success' | 'warning' | 'number' | 'path' | 'suggestions'

interface AnalyzeReportAppProps {
  report: UsageReport
}

interface TableCell {
  value: string | string[]
  kind: CellKind
  title?: string
}

interface RowCellProps {
  cell: TableCell
}

const tabs: Tab[] = ['tokens', 'recipes', 'raw values', 'files']
const summaryOrder = ['tokens', 'recipes', 'utilities', 'patterns', 'keyframes'] as const

export function AnalyzeReportApp(props: AnalyzeReportAppProps) {
  const { report } = props
  const [tab, setTab] = useState<Tab>('tokens')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const context = useMemo(() => createReportContext(report, query, filter), [report, query, filter])
  const view = createView(report, context, tab)

  return (
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <PandaLogoMark />
          <div>
            <p class="eyebrow">Panda CSS</p>
            <h1>Analyze report</h1>
          </div>
        </div>
        <div class="top-meta">
          <span class="chip">{report.sourceCount} files scanned</span>
          <span class="chip" data-tone="success">
            Static report
          </span>
        </div>
      </header>

      <main class="layout">
        <aside class="rail">
          <section class="panel">
            <div class="panel-header">
              <h2>Overview</h2>
              <span class="chip">Scope: {report.scope}</span>
            </div>
            <div class="panel-body">
              <Summary report={report} />
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <h2>Project</h2>
            </div>
            <div class="panel-body">
              <ProjectStats report={report} />
            </div>
          </section>
        </aside>

        <section class="workspace">
          <section class="workspace-panel">
            <div class="toolbar">
              <div class="view-title">
                <h2>{view.title}</h2>
                <p>{view.description}</p>
              </div>
              <div class="controls">
                <label class="search" htmlFor="analyze-search">
                  <input
                    id="analyze-search"
                    name="search"
                    type="search"
                    value={query}
                    placeholder="Search files, tokens, recipes, raw values..."
                    onInput={(event) => setQuery(event.currentTarget.value.toLowerCase())}
                  />
                </label>
                <select
                  id="analyze-filter"
                  name="filter"
                  value={filter}
                  aria-label="Filter report"
                  onChange={(event) => setFilter(event.currentTarget.value)}
                >
                  {view.filterOptions.map((option) => (
                    <option value={option} key={option}>
                      {title(option)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <nav class="tabs" role="tablist" aria-label="Analyze report sections">
              {tabs.map((item) => (
                <button
                  type="button"
                  key={item}
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => {
                    setTab(item)
                    setFilter('all')
                  }}
                >
                  {title(item)}
                  <span class="tab-count">{tabCount(report, item)}</span>
                </button>
              ))}
            </nav>

            <ReportTable headers={view.headers} rows={view.rows} />
          </section>
        </section>
      </main>
    </div>
  )
}

function PandaLogoMark() {
  return (
    <svg class="brand-logo" viewBox="0 0 258.281 261" fill="none" role="img" aria-label="Panda CSS">
      <path
        d="M0 29.9062C0 13.3895 13.3895 0 29.9062 0H228.375C244.892 0 258.281 13.3895 258.281 29.9062V231.094C258.281 247.611 244.892 261 228.375 261H29.9062C13.3895 261 0 247.611 0 231.094V29.9062Z"
        fill="#F6E458"
      />
      <path
        d="M165.516 58.3403C151.266 54.247 136.732 53.6906 121.92 55.0153C113.631 55.8766 105.662 57.522 97.9756 60.4093C81.3617 66.65 68.8872 77.4585 61.4489 93.732C56.1163 105.399 54.1891 117.792 53.9882 130.508C53.7759 143.947 55.46 157.199 58.1359 170.338C60.5614 182.248 63.7916 193.924 68.4047 205.195C68.843 206.266 69.3889 206.628 70.5587 206.625C85.149 206.594 99.7394 206.594 114.33 206.594C118.649 206.594 122.969 206.594 127.288 206.593C127.619 206.593 127.949 206.575 128.33 206.554C128.524 206.543 128.731 206.532 128.957 206.522C128.87 206.313 128.791 206.121 128.718 205.942C128.573 205.588 128.448 205.281 128.307 204.981C127.252 202.724 126.175 200.476 125.098 198.228C122.762 193.353 120.427 188.478 118.314 183.508C111.907 168.434 107 152.913 105.503 136.484C104.842 129.235 104.934 122.028 106.945 114.965C109.244 106.891 114.177 101.191 122.356 98.8079C129.867 96.6197 137.481 96.6341 144.951 99.0496C151.618 101.205 155.964 105.759 157.813 112.577C159.233 117.814 159.232 123.107 158.158 128.386C157.331 132.45 155.666 136.159 152.668 139.126C147.292 144.448 140.577 145.672 133.373 145.264C132.091 145.192 130.813 145.051 129.496 144.906C128.879 144.839 128.254 144.77 127.615 144.707C127.634 144.911 127.644 145.099 127.653 145.275C127.672 145.621 127.688 145.921 127.76 146.208C128.067 147.442 128.359 148.68 128.652 149.919C129.357 152.903 130.062 155.887 130.968 158.808C132.748 164.545 134.817 170.144 137.163 175.61C153.886 174.305 169.289 170.148 185.638 160.334C185.883 160.179 186.106 160.039 186.33 159.9C193.352 155.529 199.035 149.857 202.955 142.534C209.302 130.675 210.539 117.993 208.654 104.902C206.708 91.3933 200.645 80.0538 190.209 71.1591C182.971 64.9899 174.6 60.9496 165.516 58.3403Z"
        fill="black"
      />
    </svg>
  )
}

function Summary(props: { report: UsageReport }) {
  const maxUsed = Math.max(1, ...summaryOrder.map((name) => props.report.summary[name]?.used || 0))

  return (
    <div class="metric-list">
      {summaryOrder.map((name) => {
        const value = props.report.summary[name] || { used: 0, unique: 0 }
        const width = getMetricWidth(value.used, value.total, maxUsed)
        const metricValue = typeof value.total === 'number' ? `${value.used} / ${value.total}` : value.used

        return (
          <div class="metric" key={name}>
            <div class="metric-top">
              <span class="metric-name">{name}</span>
              <strong class="metric-value">{metricValue}</strong>
            </div>
            <div class="meter" aria-hidden="true">
              <span style={{ '--width': `${width}%` }} />
            </div>
            <div class="metric-detail">{value.unique} unique</div>
          </div>
        )
      })}
    </div>
  )
}

function getMetricWidth(used: number, total: number | undefined, maxUsed: number) {
  const denominator = typeof total === 'number' && total > 0 ? total : maxUsed
  if (used <= 0 || denominator <= 0) return 0
  return Math.min(100, Math.round((used / denominator) * 1000) / 10)
}

function ProjectStats(props: { report: UsageReport }) {
  const diagnostics = props.report.files.reduce((count, file) => count + file.diagnostics, 0)
  const stats = [
    ['Files scanned', props.report.sourceCount],
    ['Source usages', props.report.sourceUsages],
    ['Diagnostics', diagnostics],
    ['Report scope', props.report.scope],
  ]

  return (
    <dl class="stats">
      {stats.map(([name, value]) => (
        <div class="stat-row" key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ReportTable(props: { headers: string[]; rows: TableCell[][] }) {
  if (!props.rows.length) {
    return (
      <div class="empty">
        <strong>No matching results</strong>
        <span>Try a different search or filter.</span>
      </div>
    )
  }

  return (
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            {props.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <RowCell cell={cell} key={cellIndex} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RowCell(props: RowCellProps) {
  const { cell } = props

  if (cell.kind === 'path') {
    return (
      <td>
        <span class="path" title={cell.title || String(cell.value)}>
          {cell.value}
        </span>
      </td>
    )
  }

  if (cell.kind === 'code') {
    return (
      <td>
        <code class="code">{cell.value}</code>
      </td>
    )
  }

  if (cell.kind === 'badge') {
    return (
      <td>
        <span class="badge">{cell.value}</span>
      </td>
    )
  }

  if (cell.kind === 'success' || cell.kind === 'warning') {
    return (
      <td>
        <span class="badge" data-tone={cell.kind}>
          {cell.value}
        </span>
      </td>
    )
  }

  if (cell.kind === 'number') {
    return (
      <td>
        <span class="number">{cell.value}</span>
      </td>
    )
  }

  if (cell.kind === 'suggestions') {
    const values = Array.isArray(cell.value) ? cell.value : []

    return (
      <td>
        <span class="suggestions">
          {values.length ? (
            values.map((value) => (
              <span class="badge" data-tone="success" key={value}>
                {value}
              </span>
            ))
          ) : (
            <span class="badge">No match</span>
          )}
        </span>
      </td>
    )
  }

  return <td>{cell.value}</td>
}

function createReportContext(report: UsageReport, query: string, filter: string) {
  const fileById = new Map(report.facts.files.map((file) => [file.id, file]))
  const tokenById = new Map(report.facts.tokens.map((token) => [token.id, token]))
  const recipeById = new Map(report.facts.recipes.map((recipe) => [recipe.id, recipe]))
  const pathPrefix = commonPathPrefix(report.facts.files.map((file) => file.path))
  const suggestionsByRaw = new Map<number, string[]>()

  for (const item of report.facts.rawValueSuggestions) {
    const list = suggestionsByRaw.get(item.rawValueId) || []
    list.push(item.token)
    suggestionsByRaw.set(item.rawValueId, list)
  }

  return {
    fileById,
    filter,
    matches: (...values: unknown[]) => !query || values.some((value) => text(value).includes(query)),
    pathPrefix,
    recipeById,
    suggestionsByRaw,
    tokenById,
  }
}

function createView(report: UsageReport, context: ReturnType<typeof createReportContext>, tab: Tab) {
  if (tab === 'recipes') return createRecipesView(report, context)
  if (tab === 'raw values') return createRawValuesView(report, context)
  if (tab === 'files') return createFilesView(report, context)
  return createTokensView(report, context)
}

function createTokensView(report: UsageReport, context: ReturnType<typeof createReportContext>) {
  const rows = report.facts.tokenUsages
    .map((usage) => {
      const token = context.tokenById.get(usage.tokenId)
      const file = context.fileById.get(usage.fileId)
      return { token, file, usage }
    })
    .filter(
      ({ token, file }) =>
        token &&
        file &&
        (context.filter === 'all' || token.category === context.filter) &&
        context.matches(token.path, token.category, file.path),
    )

  const filterOptions = unique([
    'all',
    ...rows.map((row) => row.token?.category).filter((category): category is string => Boolean(category)),
  ])

  return {
    title: 'Tokens',
    description: `${rows.length} token references across ${report.sourceCount} files`,
    filterOptions,
    headers: ['Token', 'Category', 'Status', 'File', 'Location'],
    rows: rows.map(({ token, file, usage }) => [
      cell(token?.path, 'code'),
      cell(token?.category, 'badge'),
      cell(token?.configured ? 'Configured' : 'Missing', token?.configured ? 'success' : 'warning'),
      cell(displayPath(file?.path, context.pathPrefix), 'path', file?.path),
      cell(`L${usage.line}:C${usage.column}`, 'number'),
    ]),
  }
}

function createRecipesView(report: UsageReport, context: ReturnType<typeof createReportContext>) {
  const recipeRows = report.facts.recipeUsages.map((usage) => {
    const recipe = context.recipeById.get(usage.recipeId)
    const file = context.fileById.get(usage.fileId)
    return { recipe, file, usage, kind: 'Recipe', detail: usage.syntax }
  })
  const variantRows = report.facts.recipeVariantUsages.map((usage) => {
    const recipe = context.recipeById.get(usage.recipeId)
    const file = context.fileById.get(usage.fileId)
    return { recipe, file, usage, kind: 'Variant', detail: `${usage.variant}: ${usage.value}` }
  })
  const rows = [...recipeRows, ...variantRows].filter(
    ({ recipe, file, detail }) => recipe && file && context.matches(recipe.name, detail, file.path),
  )

  return {
    title: 'Recipes',
    description: `${rows.length} recipe references`,
    filterOptions: ['all'],
    headers: ['Recipe', 'Kind', 'Detail', 'File', 'Location'],
    rows: rows.map(({ recipe, file, usage, kind, detail }) => [
      cell(recipe?.name, 'code'),
      cell(kind, 'badge'),
      cell(detail, 'code'),
      cell(displayPath(file?.path, context.pathPrefix), 'path', file?.path),
      cell(`L${usage.line}:C${usage.column}`, 'number'),
    ]),
  }
}

function createRawValuesView(report: UsageReport, context: ReturnType<typeof createReportContext>) {
  const usageCount = new Map<number, number>()
  for (const usage of report.facts.rawValueUsages) {
    usageCount.set(usage.rawValueId, (usageCount.get(usage.rawValueId) || 0) + 1)
  }
  const rows = report.facts.rawValues.filter(
    (raw) =>
      (context.filter === 'all' || raw.category === context.filter) &&
      context.matches(raw.prop, raw.value, raw.category, context.suggestionsByRaw.get(raw.id)?.join(' ')),
  )

  return {
    title: 'Raw values',
    description: `${rows.length} hardcoded values with token suggestions`,
    filterOptions: unique(['all', ...rows.map((raw) => raw.category)]),
    headers: ['Prop', 'Value', 'Category', 'Uses', 'Suggestions'],
    rows: rows.map((raw) => [
      cell(raw.prop, 'code'),
      cell(raw.value, 'code'),
      cell(raw.category, 'badge'),
      cell(String(usageCount.get(raw.id) || 0), 'number'),
      cell(context.suggestionsByRaw.get(raw.id) || [], 'suggestions'),
    ]),
  }
}

function createFilesView(report: UsageReport, context: ReturnType<typeof createReportContext>) {
  const rows = report.files.filter((file) => context.matches(file.path))

  return {
    title: 'Files',
    description: `${rows.length} files in the current result`,
    filterOptions: ['all'],
    headers: ['File', 'Tokens', 'Recipes', 'Utilities', 'Diagnostics'],
    rows: rows.map((file) => [
      cell(displayPath(file.path, context.pathPrefix), 'path', file.path),
      cell(String(file.counts.tokens), 'number'),
      cell(String(file.counts.recipes), 'number'),
      cell(String(file.counts.utilities), 'number'),
      cell(String(file.diagnostics), file.diagnostics > 0 ? 'warning' : 'success'),
    ]),
  }
}

function cell(value: unknown, kind: CellKind, title?: string): TableCell {
  return { value: Array.isArray(value) ? value : String(value ?? ''), kind, title }
}

function tabCount(report: UsageReport, tab: Tab) {
  if (tab === 'tokens') return report.facts.tokenUsages.length
  if (tab === 'recipes') return report.facts.recipeUsages.length + report.facts.recipeVariantUsages.length
  if (tab === 'raw values') return report.facts.rawValues.length
  return report.files.length
}

function displayPath(path: string | undefined, pathPrefix: string) {
  if (!path) return ''
  if (!pathPrefix || !path.startsWith(pathPrefix)) return path
  return path.slice(pathPrefix.length).replace(/^\/+/, '')
}

function commonPathPrefix(paths: string[]) {
  if (!paths.length) return ''
  const parts = paths.map((path) => path.split('/'))
  const prefix: string[] = []

  for (let index = 0; index < parts[0].length; index++) {
    const part = parts[0][index]
    if (!parts.every((items) => items[index] === part)) break
    prefix.push(part)
  }

  return prefix.length > 1 ? `${prefix.join('/')}/` : ''
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function title(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

function text(value: unknown) {
  return String(value ?? '').toLowerCase()
}
