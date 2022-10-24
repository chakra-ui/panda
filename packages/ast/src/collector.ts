import type { PluginResult } from '@css-panda/types'

export function createCollector() {
  return {
    sx: new Set<PluginResult>(),
    jsx: new Set<PluginResult>(),
    css: new Set<PluginResult>(),
    globalCss: new Set<PluginResult>(),
    fontFace: new Set<PluginResult>(),
    cssMap: new Set<PluginResult>(),
    recipe: new Map<string, Set<PluginResult>>(),
    pattern: new Map<string, Set<PluginResult>>(),
    addPattern(name: string, data: any) {
      this.pattern.get(name) ?? this.pattern.set(name, new Set([]))
      this.pattern.get(name)?.add({ type: 'object', data, name })
    },
    isEmpty() {
      return (
        this.css.size === 0 &&
        this.sx.size === 0 &&
        this.globalCss.size === 0 &&
        this.fontFace.size === 0 &&
        this.cssMap.size === 0 &&
        this.recipe.size === 0 &&
        this.pattern.size === 0 &&
        this.jsx.size === 0
      )
    },
  }
}

export type Collector = ReturnType<typeof createCollector>
