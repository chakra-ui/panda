import { evalConfig } from '@/src/lib/config/eval-config'
import { getImports } from '@/src/lib/config/get-imports'

export const compile = async (configStr: string) => {
  const importShim = (0, eval)('u=>import(u)')

  const require = async (module: string) => {
    const href = 'https://cdn.skypack.dev/' + module + '?min'
    try {
      return await importShim(href)
    } catch (error) {
      throw new Error("Failed to fetch module '" + module + "'")
    }
  }

  const _imports = getImports(configStr)
  const imports = await Promise.all(
    _imports.map(async (_imp) => {
      const imp = await require(_imp.pkg)
      return Object.entries(_imp.exps).map(([key, val]) => {
        if (key === 'default') return { [val]: imp.default ?? imp }
        if (val === '*') return { [key]: imp }
        return { [val ?? key]: imp[key] }
      })
    }),
  )

  const scope = imports.flat().reduce((acc, cur) => Object.assign({}, acc, cur), {})
  const _config = evalConfig(configStr, scope)

  const _presets = _config?.presets?.filter(Boolean) ?? []
  const presets = await Promise.all(
    _presets.map(async (_preset) => {
      if (typeof _preset !== 'string') return _preset
      const preset = await require(_preset)
      if (preset.default) return preset.default
      throw new Error("Could not find a default export in preset: '" + module + "'")
    }),
  )

  const config = Object.assign({}, _config, presets.length ? { presets } : {})

  return config
}
