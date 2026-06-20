import type { Compiler } from '@pandacss/compiler'
import { createCompilerFromSnapshot } from '@pandacss/compiler'
import type { LoadConfigResult } from '@pandacss/config'
import { loadConfig } from '@pandacss/config'
import type { PandaLintSettings } from './settings'

export interface ProjectContext {
  compiler: Compiler
  configPath: string
  dependencies: string[]
}

export interface ProjectCacheOptions {
  load?: (settings: PandaLintSettings) => Promise<LoadConfigResult>
  createCompiler?: typeof createCompilerFromSnapshot
}

export class ProjectCache {
  #projects = new Map<string, Promise<ProjectContext>>()
  #load: (settings: PandaLintSettings) => Promise<LoadConfigResult>
  #createCompiler: typeof createCompilerFromSnapshot

  constructor(options: ProjectCacheOptions = {}) {
    this.#load =
      options.load ??
      ((settings) =>
        loadConfig({
          cwd: settings.cwd,
          ...(settings.configPath ? { file: settings.configPath } : {}),
        }))
    this.#createCompiler = options.createCompiler ?? createCompilerFromSnapshot
  }

  get(settings: PandaLintSettings): Promise<ProjectContext> {
    const key = projectCacheKey(settings)
    const cached = this.#projects.get(key)
    if (cached) return cached

    const project = this.#load(settings).then((result) => ({
      compiler: this.#createCompiler({
        config: result.config,
        callbacks: result.callbacks,
        ...(result.hooks ? { hooks: result.hooks } : {}),
      }),
      configPath: result.path,
      dependencies: result.dependencies,
    }))
    this.#projects.set(key, project)
    return project
  }

  clear(): void {
    this.#projects.clear()
  }
}

export function projectCacheKey(settings: PandaLintSettings): string {
  return `${settings.cwd}\0${settings.configPath ?? ''}`
}
