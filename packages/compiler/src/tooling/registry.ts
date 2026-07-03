import { createProjectFromConfig, type Project, type ProjectKey } from './create-project'

export type { ProjectKey }

export interface ProjectRegistryOptions {
  createProject?: (key: ProjectKey) => Promise<Project>
}

// No discover()/resolveConfigForFile() yet — nothing calls this against a
// multi-config workspace today; see design-notes/language-service-implementation.md.
export class ProjectRegistry {
  #projects = new Map<string, Promise<Project>>()
  #createProject: (key: ProjectKey) => Promise<Project>

  constructor(options: ProjectRegistryOptions = {}) {
    this.#createProject = options.createProject ?? ((key) => createProjectFromConfig(key))
  }

  getProject(key: ProjectKey): Promise<Project> {
    const cacheKey = registryKey(key)
    const cached = this.#projects.get(cacheKey)
    if (cached) return cached
    const project = this.#createProject(key)
    this.#projects.set(cacheKey, project)
    return project
  }

  // Coarse: wipes the whole cache regardless of which paths changed.
  invalidate(_changedPaths: string[] = []): void {
    this.#projects.clear()
  }
}

function registryKey(key: ProjectKey): string {
  return `${key.cwd}\0${key.configPath ?? ''}`
}
