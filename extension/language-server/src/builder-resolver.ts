import { Builder } from '@pandacss/node'
import path from 'path'

/**
 * - Calls builder.setup() for the closest config file to the given filepath
 * - Keep track of all the config files and their builders
 * - Share the setup promise so it can be awaited anywhere
 */
export class BuilderResolver {
  private builderByConfigDirpath = new Map<string, Builder>()
  private synchronizingByConfigDirpath = new Map<string, Promise<void> | false>()

  private configDirpathList = new Set<string>()
  private configDirPathByFilepath = new Map<string, string>()
  private configPathByDirpath = new Map<string, string>()
  private _onSetup: ((args: { configPath: string }) => void) | undefined

  findConfigDirpath<T>(filepath: string, onFound: (configDirPath: string, configPath: string) => T) {
    const cachedDir = this.configDirPathByFilepath.get(filepath)
    if (cachedDir) {
      return onFound(cachedDir, this.configPathByDirpath.get(cachedDir)!)
    }

    const dirpath = path.dirname(filepath)

    for (const configDirpath of this.configDirpathList) {
      if (dirpath.startsWith(configDirpath)) {
        this.configDirPathByFilepath.set(filepath, configDirpath)
        return onFound(configDirpath, this.configPathByDirpath.get(configDirpath)!)
      }
    }
  }

  get(filepath: string) {
    return this.findConfigDirpath(filepath, (configDirpath) => this.builderByConfigDirpath.get(configDirpath))
  }

  isContextSynchronizing(filepath: string) {
    return this.findConfigDirpath(filepath, (configDirpath) => this.synchronizingByConfigDirpath.get(configDirpath))
  }

  create(configPath: string) {
    const builder = new Builder()

    const dirpath = path.dirname(configPath)
    this.configDirPathByFilepath.set(configPath, dirpath)
    this.builderByConfigDirpath.set(dirpath, builder)
    this.configDirpathList.add(dirpath)
    this.configPathByDirpath.set(dirpath, configPath)

    return this
  }

  async setup(filepath: string) {
    return this.findConfigDirpath(filepath, async (configDirpath, configPath) => {
      const builder = this.builderByConfigDirpath.get(configDirpath)
      if (!builder) {
        return
      }

      const current = this.synchronizingByConfigDirpath.get(configDirpath)
      if (current) {
        return current
      }

      const synchronizing = builder.setup({ configPath })
      this.synchronizingByConfigDirpath.set(configDirpath, synchronizing)

      synchronizing.finally(() => {
        this.synchronizingByConfigDirpath.set(configDirpath, false)

        this._onSetup?.({ configPath })
      })

      return synchronizing
    })
  }

  onSetup(callback: (args: { configPath: string }) => void) {
    this._onSetup = callback
  }
}
