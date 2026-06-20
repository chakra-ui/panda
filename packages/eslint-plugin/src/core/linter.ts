import type { FileInspectionResult } from '@pandacss/compiler'
import { Inspector } from './inspector'
import { ProjectCache, type ProjectContext } from './project-cache'
import { type PandaLintSettings, type RuleContextLike, resolvePandaSettings } from './settings'

export interface SourceCodeLike {
  text: string
}

export interface LintRuleContextLike extends RuleContextLike {
  filename?: string
  physicalFilename?: string
  sourceCode?: SourceCodeLike
  getFilename?: () => string
  getPhysicalFilename?: () => string
  getSourceCode?: () => SourceCodeLike
}

export interface LintInspection {
  project: ProjectContext
  settings: PandaLintSettings
  path: string
  source: string
  result: FileInspectionResult
}

export interface LinterOptions {
  projectCache?: ProjectCache
  inspector?: Inspector
}

export class Linter {
  #projectCache: ProjectCache
  #inspector: Inspector

  constructor(options: LinterOptions = {}) {
    this.#projectCache = options.projectCache ?? new ProjectCache()
    this.#inspector = options.inspector ?? new Inspector()
  }

  getProject(context: LintRuleContextLike): Promise<ProjectContext> {
    return this.#projectCache.get(resolvePandaSettings(context))
  }

  async inspect(context: LintRuleContextLike): Promise<LintInspection> {
    const settings = resolvePandaSettings(context)
    const project = await this.#projectCache.get(settings)
    const path = getContextFilename(context)
    const source = getContextSource(context)
    const result = this.inspectProject(project, path, source)
    return { project, settings, path, source, result }
  }

  inspectProject(project: ProjectContext, path: string, source: string): FileInspectionResult {
    return this.#inspector.inspect(project.compiler, path, source)
  }

  clear(): void {
    this.#projectCache.clear()
    this.#inspector.clear()
  }
}

export function getContextFilename(context: LintRuleContextLike): string {
  return (
    cleanFilename(context.physicalFilename) ??
    cleanFilename(context.filename) ??
    cleanFilename(context.getPhysicalFilename?.()) ??
    cleanFilename(context.getFilename?.()) ??
    '<unknown>'
  )
}

export function getContextSource(context: LintRuleContextLike): string {
  return context.sourceCode?.text ?? context.getSourceCode?.().text ?? ''
}

function cleanFilename(value: string | undefined): string | undefined {
  if (!value || value === '<text>' || value === '<input>') return undefined
  return value
}
