import type { UsageReport } from '@pandacss/compiler-shared'
import { analyzeReportScript, analyzeReportStyle } from './analyze-report.generated'

export function renderAnalyzeHtml(report: UsageReport): string {
  const data = escapeScriptJson(JSON.stringify(report))

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Panda analyze report</title>
  <link rel="icon" href="data:," />
  <style>${analyzeReportStyle}</style>
</head>
<body>
  <div id="root"></div>
  <script type="application/json" id="panda-analyze-data">${data}</script>
  <script>${analyzeReportScript}</script>
</body>
</html>`
}

function escapeScriptJson(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
