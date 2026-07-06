import { createProjectFromConfig, type Project } from '@pandacss/compiler/tooling'
import type { PandaLintSettings } from './settings'

export interface ProjectCacheOptions {
  createProject?: (settings: PandaLintSettings) => Promise<Project>
}

export class ProjectCache {
  #projects = new Map<string, Promise<Project>>()
  #createProject: (settings: PandaLintSettings) => Promise<Project>

  constructor(options: ProjectCacheOptions = {}) {
    this.#createProject =
      options.createProject ??
      ((settings) => createProjectFromConfig({ cwd: settings.cwd, configPath: settings.configPath }))
  }

  get(settings: PandaLintSettings): Promise<Project> {
    const key = projectCacheKey(settings)
    const cached = this.#projects.get(key)
    if (cached) return cached

    const project = this.#createProject(settings)
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
