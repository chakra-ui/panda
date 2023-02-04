type Result = {
  name?: string
  data: Record<string, any>
  type?: string
}

type PartialResult = {
  data: Record<string, any>
}

export const createParserResult = () => ({
  jsx: new Set<Result>(),
  css: new Set<Result>(),
  cva: new Set<Result>(),
  recipe: new Map<string, Set<Result>>(),
  pattern: new Map<string, Set<Result>>(),
  set(name: 'cva' | 'css', result: PartialResult) {
    this[name].add({ type: 'object', ...result })
  },
  setCva(result: PartialResult) {
    this.cva.add({ type: 'cva', ...result })
  },
  setPattern(name: string, result: PartialResult) {
    this.pattern.get(name) ?? this.pattern.set(name, new Set())
    this.pattern.get(name)?.add({ type: 'pattern', name, ...result })
  },
  setRecipe(name: string, result: PartialResult) {
    this.recipe.get(name) ?? this.recipe.set(name, new Set())
    this.recipe.get(name)?.add({ type: 'recipe', ...result })
  },
  isEmpty() {
    return (
      this.css.size === 0 &&
      this.cva.size === 0 &&
      this.recipe.size === 0 &&
      this.pattern.size === 0 &&
      this.jsx.size === 0
    )
  },
})

export type ParserResult = ReturnType<typeof createParserResult>
