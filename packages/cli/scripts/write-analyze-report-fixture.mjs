import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runAnalyze } from '../dist/index.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const outfile = join(packageRoot, 'report-ui/fixtures/remix-report.json')

mkdirSync(dirname(outfile), { recursive: true })

const result = await runAnalyze({
  cwd: join(packageRoot, '../../sandbox/remix'),
  logLevel: 'silent',
  outfile,
  scope: 'all',
})

if (!result.ok) {
  process.exitCode = 1
}
