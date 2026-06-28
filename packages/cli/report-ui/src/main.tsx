import { render } from 'preact'
import type { UsageReport } from '@pandacss/compiler-shared'
import { AnalyzeReportApp } from './App'
import './styles.css'

void loadReport().then((report) => {
  const root = document.getElementById('root')
  if (!root) return
  render(<AnalyzeReportApp report={report} />, root)
})

async function loadReport(): Promise<UsageReport> {
  const embedded = document.getElementById('panda-analyze-data')?.textContent
  if (embedded) return JSON.parse(embedded) as UsageReport

  const response = await fetch('/fixtures/remix-report.json')
  if (!response.ok) {
    throw new Error(`Unable to load analyze report fixture: ${response.status}`)
  }
  return (await response.json()) as UsageReport
}
