import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { NodeDriver } from '@pandacss/compiler'
import { analyzeSources, type Diagnostic, type UsageReport } from '@pandacss/compiler-shared'
import type { StudioMessage } from './studio-server'

export interface StudioProject {
  diagnostics: Diagnostic[]
  snapshot(): StudioMessage[]
  /** Re-analyze after source changes; returns what changed, report last. */
  update(): StudioMessage[]
  /** After a config reload: the new system and everything that depends on it. */
  reload(): StudioMessage[]
}

export interface StudioProjectOptions {
  cwd: string
  include?: string[]
}

export function createStudioProject(driver: NodeDriver, options: StudioProjectOptions): StudioProject {
  let spec = ''
  let report: UsageReport
  let sources = new Map<string, string>()
  let diagnostics: Diagnostic[] = []

  const analyze = () => {
    const result = analyzeSources(driver.compiler, driver.scan({ include: options.include }), 'all')
    diagnostics = result.diagnostics
    return result.report
  }

  // Studio shows code only for files the report mentions.
  const readSources = (next: UsageReport) => {
    const texts = new Map<string, string>()
    for (const file of next.facts.files) {
      try {
        texts.set(file.path, readFileSync(resolve(options.cwd, file.path), 'utf8'))
      } catch {
        // Deleted between the scan and the read; the next update drops it.
      }
    }
    return texts
  }

  const refresh = () => {
    spec = driver.specJson() ?? ''
    report = analyze()
    sources = readSources(report)
  }

  const snapshot = (): StudioMessage[] => [
    { type: 'system', spec },
    { type: 'sources', files: [...sources].map(([path, text]) => ({ path, text })) },
    { type: 'report', report },
  ]

  refresh()

  return {
    get diagnostics() {
      return diagnostics
    },
    snapshot,
    update() {
      const next = analyze()
      const nextSources = readSources(next)
      const messages: StudioMessage[] = []
      for (const [path, text] of nextSources) {
        if (sources.get(path) !== text) messages.push({ type: 'source', path, text })
      }
      for (const path of sources.keys()) {
        if (!nextSources.has(path)) messages.push({ type: 'removed', path })
      }
      report = next
      sources = nextSources
      messages.push({ type: 'report', report })
      return messages
    },
    reload() {
      refresh()
      return snapshot()
    },
  }
}
