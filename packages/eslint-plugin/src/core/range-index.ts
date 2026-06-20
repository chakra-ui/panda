import type { Span } from '@pandacss/compiler'

export interface RangeLike {
  span: Span
}

export class RangeIndex<T extends RangeLike> {
  #items: T[]

  constructor(items: readonly T[]) {
    this.#items = [...items].sort((a, b) => a.span.start - b.span.start || a.span.end - b.span.end)
  }

  at(offset: number): T | undefined {
    return this.#items.find((item) => item.span.start <= offset && offset <= item.span.end)
  }

  enclosing(span: Span): T | undefined {
    return this.#items.find((item) => item.span.start <= span.start && item.span.end >= span.end)
  }

  exact(span: Span): T | undefined {
    return this.#items.find((item) => item.span.start === span.start && item.span.end === span.end)
  }

  all(): readonly T[] {
    return this.#items
  }
}
