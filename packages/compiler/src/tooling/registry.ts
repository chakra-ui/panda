import { watch, type FSWatcher } from 'node:fs'
import { dirname, join } from 'node:path'
import { findConfig } from '@pandacss/config'
import { createProjectFromConfig, type Project, type ProjectKey } from './create-project'

export type { ProjectKey }

export interface ProjectRegistryOptions {
  createProject?: (key: ProjectKey) => Promise<Project>
}

// No discover()/resolveConfigForFile() yet — nothing calls this against a
// multi-config workspace today; see design-notes/language-service-implementation.md.
export class ProjectRegistry {
  #projects = new Map<string, Promise<Project>>()
  #watchers = new Map<string, FSWatcher[]>()
  #createProject: (key: ProjectKey) => Promise<Project>

  constructor(options: ProjectRegistryOptions = {}) {
    this.#createProject = options.createProject ?? ((key) => createProjectFromConfig(key))
  }

  getProject(key: ProjectKey): Promise<Project> {
    const resolvedPath = resolveConfigPath(key)
    const cacheKey = resolvedPath ?? syntheticKey(key)
    const cached = this.#projects.get(cacheKey)
    if (cached) return cached

    // Watch the config file itself before the load even settles, so fixing a bad config
    // (syntax error, missing preset, ...) and saving retries instead of staying cached forever
    // — a rejected promise is still a cached promise otherwise.
    if (resolvedPath) this.#watch(cacheKey, [resolvedPath])

    const project = this.#createProject(key)
    project.then(
      (resolved) => {
        // Only still the active promise for this key — a concurrent invalidation may have
        // already evicted it, and re-watching would leak watchers for a stale cache entry.
        if (resolvedPath && this.#projects.get(cacheKey) === project) {
          this.#watch(cacheKey, [resolvedPath, ...resolved.dependencies])
        }
      },
      () => this.#evict(cacheKey),
    )
    this.#projects.set(cacheKey, project)
    return project
  }

  // Coarse: wipes the whole cache regardless of which paths changed.
  invalidate(_changedPaths: string[] = []): void {
    for (const watchers of this.#watchers.values()) {
      for (const watcher of watchers) watcher.close()
    }
    this.#watchers.clear()
    this.#projects.clear()
  }

  // Watches directories (not individual files) — editors that save via atomic
  // rename/replace can otherwise silently stop notifying a file-level watcher.
  #watch(cacheKey: string, paths: string[]): void {
    this.#closeWatchers(cacheKey)

    const filesByDir = new Map<string, Set<string>>()
    for (const path of new Set(paths)) {
      const dir = dirname(path)
      if (!filesByDir.has(dir)) filesByDir.set(dir, new Set())
      filesByDir.get(dir)?.add(path)
    }

    const watchers: FSWatcher[] = []
    for (const [dir, filesInDir] of filesByDir) {
      try {
        watchers.push(
          watch(dir, (_event, filename) => {
            if (filename && filesInDir.has(join(dir, filename))) this.#evict(cacheKey)
          }),
        )
      } catch {
        // Directory not watchable (deleted, permissions, ...) — best-effort only.
      }
    }
    this.#watchers.set(cacheKey, watchers)
  }

  #closeWatchers(cacheKey: string): void {
    for (const watcher of this.#watchers.get(cacheKey) ?? []) watcher.close()
  }

  #evict(cacheKey: string): void {
    this.#closeWatchers(cacheKey)
    this.#watchers.delete(cacheKey)
    this.#projects.delete(cacheKey)
  }
}

// A config can be split across multiple files (recipes, semantic tokens, etc. imported into
// panda.config.ts) — callers may pass the directory of whichever file is currently being
// edited, not necessarily the config's own directory. Resolve to the actual config file first
// so every file under the same project root shares one cached project instead of one per
// distinct edited-file directory.
function resolveConfigPath(key: ProjectKey): string | undefined {
  try {
    return findConfig({ cwd: key.cwd, file: key.configPath })
  } catch {
    return undefined
  }
}

// No config file exists yet (e.g. before `panda init`) — fall back to a key that at least
// dedupes repeated calls for the same (cwd, configPath) without pretending to watch anything.
function syntheticKey(key: ProjectKey): string {
  return `${key.cwd}\0${key.configPath ?? ''}`
}
