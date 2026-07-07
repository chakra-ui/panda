import { cx } from './cx'

/** Transformed `css()` sites receive pre-encoded class strings only. */
export function css(...styles: string[]): string {
  return cx(...styles)
}
