import { render } from 'preact'
import type { UsageReport } from '@pandacss/compiler-shared'
import { AnalyzeReportApp } from './App'
import './styles.css'

const root = document.getElementById('root')

if (root) {
  void renderLatestReport()
}

async function loadReport(): Promise<{ report: UsageReport; live: boolean }> {
  const embedded = document.getElementById('panda-analyze-data')?.textContent
  if (embedded) return { report: JSON.parse(embedded) as UsageReport, live: false }

  const live = await tryLoadReport('/api/report')
  if (live) return { report: live, live: true }

  const fixture = await tryLoadReport('/fixtures/remix-report.json')
  if (fixture) return { report: fixture, live: false }

  throw new Error('Unable to load analyze report data')
}

async function renderLatestReport(): Promise<void> {
  if (!root) return
  const { report, live } = await loadReport()
  render(<AnalyzeReportApp report={report} />, root)
  if (live) connectLiveReload()
}

async function tryLoadReport(url: string): Promise<UsageReport | undefined> {
  const response = await fetch(url)
  if (!response.ok) return undefined
  return (await response.json()) as UsageReport
}

function connectLiveReload(): void {
  if (!('EventSource' in window)) return
  if (window.__pandaAnalyzeEventsConnected) return
  window.__pandaAnalyzeEventsConnected = true

  const events = new EventSource('/events')
  events.addEventListener('report', () => {
    void renderLatestReport()
  })
}

declare global {
  interface Window {
    __pandaAnalyzeEventsConnected?: boolean
  }
}
