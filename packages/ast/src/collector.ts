type Result = {
  name?: string
  data: Record<string, any>
  type?: string
}
export class Collector {
  jsx = new Set<Result>()
  css = new Set<Result>()
  globalCss = new Set<Result>()
  cssMap = new Set<Result>()
  recipe = new Map<string, Set<Result>>()
  pattern = new Map<string, Set<Result>>()

  set(name: string, result: { data: Record<string, any> }) {
    this[name].add({ type: 'object', ...result })
  }

  setPattern(name: string, result: { data: Record<string, any> }) {
    this.pattern.get(name) ?? this.pattern.set(name, new Set())
    this.pattern.get(name)?.add({ type: 'pattern', name, ...result })
  }

  setRecipe(name: string, result: { data: Record<string, any> }) {
    this.recipe.get(name) ?? this.recipe.set(name, new Set())
    this.recipe.get(name)?.add({ type: 'recipe', ...result })
  }

  get isEmpty() {
    return (
      this.css.size === 0 &&
      this.globalCss.size === 0 &&
      this.cssMap.size === 0 &&
      this.recipe.size === 0 &&
      this.pattern.size === 0 &&
      this.jsx.size === 0
    )
  }
}
