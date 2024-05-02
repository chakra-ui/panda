/* eslint-disable */
import type { SystemStyleObject } from '../types/index';

type Styles = SystemStyleObject | undefined | null | false

interface CssFunction {
  (styles: Styles): string
  (styles: Styles[]): string
  (...styles: Array<Styles | Styles[]>): string
  (styles: Styles): string

  raw: (styles: Styles) => string
  raw: (styles: Styles[]) => string
  raw: (...styles: Array<Styles | Styles[]>) => string
  raw: (styles: Styles) => string
}

export declare const css: CssFunction;