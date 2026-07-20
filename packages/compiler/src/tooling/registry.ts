import { realpathSync, unwatchFile, watch, watchFile, type FSWatcher, type Stats } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { findConfig } from '@pandacss/config'
import { createProjectFromConfig, type Project, type ProjectKey } from './create-project'

export interface ProjectRegistryOptions {
  createProject?: (key: ProjectKey) => Promise<Project>
}

/** Fallback when directory `fs.watch` drops events (macOS FSEvents). */
const FILE_POLL_INTERVAL_MS = 1000

type PollListener = (curr: Stats, prev: Stats) => void

// No discover()/resolveConfigForFile() yet — nothing calls this against a
// multi-config workspace today; see design-notes/language-service-implementation.md.
export class ProjectRegistry {
  #projects = new Map<string, Promise<Project>>()
  #watchers = new Map<string, FSWatcher[]>()
  #watchedDirs = new Map<string, Map<string, Set<string>>>()
  /** path → listener so `unwatchFile` doesn't clear other registries. */
  #polledFiles = new Map<string, Map<string, PollListener>>()
  #createProject: (key: ProjectKey) => Promise<Project>

  constructor(options: ProjectRegistryOptions = {}) {
    this.#createProject = options.createProject ?? ((key) => createProjectFromConfig(key))
  }

  getProject(key: ProjectKey): Promise<Project> {
    const resolvedPath = resolveConfigPath(key)
    const cacheKey = resolvedPath ?? syntheticKey(key)
    const cached = this.#projects.get(cacheKey)
    if (cached) return cached

    // Watch before load settles so a rejected config can retry on save.
    if (resolvedPath) this.#watch(cacheKey, key.cwd, [resolvedPath])

    const project = this.#createProject(key)
    project.then(
      (resolved) => {
        if (resolvedPath && this.#projects.get(cacheKey) === project) {
          this.#watch(cacheKey, key.cwd, [resolvedPath, ...resolved.dependencies])
        }
      },
      () => this.#evict(cacheKey),
    )
    this.#projects.set(cacheKey, project)
    return project
  }

  invalidate(_changedPaths: string[] = []): void {
    for (const cacheKey of [...this.#watchers.keys(), ...this.#polledFiles.keys()]) {
      this.#closeWatchers(cacheKey)
    }
    this.#watchers.clear()
    this.#watchedDirs.clear()
    this.#polledFiles.clear()
    this.#projects.clear()
  }

  // Dir watch + `watchFile` poll; deps are cwd-relative like the driver.
  #watch(cacheKey: string, cwd: string, paths: string[]): void {
    const filesByDir = new Map<string, Set<string>>()
    for (const path of new Set(paths)) {
      const absolute = isAbsolute(path) ? path : resolve(cwd, path)
      const normalized = canonicalPath(absolute)
      const dir = dirname(normalized)
      if (!filesByDir.has(dir)) filesByDir.set(dir, new Set())
      filesByDir.get(dir)?.add(normalized)
    }

    const watched = this.#watchedDirs.get(cacheKey) ?? new Map<string, Set<string>>()
    const watchers = this.#watchers.get(cacheKey) ?? []

    for (const [dir, filesInDir] of filesByDir) {
      const existing = watched.get(dir)
      if (existing) {
        for (const file of filesInDir) {
          if (existing.has(file)) continue
          existing.add(file)
          this.#pollFile(cacheKey, file)
        }
        continue
      }

      const tracked = new Set(filesInDir)
      try {
        watchers.push(
          watch(dir, (_event, filename) => {
            if (!filename || tracked.has(join(dir, filename))) this.#evict(cacheKey)
          }),
        )
        watched.set(dir, tracked)
      } catch {
        // Best-effort — dir may be missing or unwatchable.
      }

      for (const file of tracked) this.#pollFile(cacheKey, file)
    }

    this.#watchedDirs.set(cacheKey, watched)
    this.#watchers.set(cacheKey, watchers)
  }

  #pollFile(cacheKey: string, file: string): void {
    const polled = this.#polledFiles.get(cacheKey) ?? new Map<string, PollListener>()
    if (polled.has(file)) return
    const listener: PollListener = () => this.#evict(cacheKey)
    polled.set(file, listener)
    this.#polledFiles.set(cacheKey, polled)
    watchFile(file, { interval: FILE_POLL_INTERVAL_MS }, listener)
  }

  #closeWatchers(cacheKey: string): void {
    for (const watcher of this.#watchers.get(cacheKey) ?? []) watcher.close()
    for (const [file, listener] of this.#polledFiles.get(cacheKey) ?? []) {
      unwatchFile(file, listener)
    }
    this.#polledFiles.delete(cacheKey)
  }

  #evict(cacheKey: string): void {
    this.#closeWatchers(cacheKey)
    this.#watchers.delete(cacheKey)
    this.#watchedDirs.delete(cacheKey)
    this.#projects.delete(cacheKey)
  }
}

function canonicalPath(filepath: string): string {
  try {
    return realpathSync(filepath)
  } catch {
    return filepath
  }
}

function resolveConfigPath(key: ProjectKey): string | undefined {
  try {
    return canonicalPath(findConfig({ cwd: key.cwd, file: key.configPath }))
  } catch {
    return undefined
  }
}

function syntheticKey(key: ProjectKey): string {
  return `${key.cwd}\0${key.configPath ?? ''}`
}
