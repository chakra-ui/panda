import { evalConfig } from '@/src/lib/compile-config/eval-config'
import { extractImports } from '@/src/lib/compile-config/extract-imports'

export const compile = async (_config: string) => {
  const importShim = (0, eval)('u=>import(u)')

  const require = async (module: string) => {
    if (typeof module !== 'string') {
      throw new Error('The "id" argument must be of type string. Received ' + typeof module)
    }
    if (module === '') {
      throw new Error("The argument 'id' must be a non-empty string. Received ''")
    }
    const href = 'https://cdn.skypack.dev/' + module + '?min'
    const res = await importShim(href)

    return res
  }

  const imports = extractImports(_config)

  const modules = await Promise.all(
    imports.map(async (_mod) => {
      const mod = await require(_mod.pkg)
      return Object.entries(_mod.exps).map(([key, val]) => {
        if (key === 'default') return { [val]: mod.default ?? mod }
        if (val === '*') return { [key]: mod }
        return { [val ?? key]: mod[key] }
      })
    }),
  )

  const scope = modules.flat().reduce((acc, cur) => Object.assign({}, acc, cur), {})
  const newConfig = evalConfig(_config, scope)

  const _presets = newConfig?.presets?.filter(Boolean) ?? []
  const presets = await Promise.all(
    _presets.map(async (_preset) => {
      if (typeof _preset !== 'string') return _preset

      const preset = await require(_preset)
      return preset.default
    }),
  )

  const config = Object.assign({}, newConfig, presets.length ? { presets } : {})

  return config
}
