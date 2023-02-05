type Result = {
  name?: string
  data: Record<string, any>
  type?: string
}

export type ParserResult = {
  jsx: Set<Result>
  css: Set<Result>
  cva: Set<Result>
  recipe: Map<string, Set<Result>>
  pattern: Map<string, Set<Result>>
  set: (name: 'cva' | 'css', result: Result) => void
  setCva: (result: Result) => void
  setRecipe: (name: string, result: Result) => void
  setPattern: (name: string, result: Result) => void
  isEmpty: () => boolean
}
