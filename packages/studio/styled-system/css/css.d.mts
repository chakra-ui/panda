/* eslint-disable */
import type { SystemStyleObject } from '../types/index.d.mts'

interface CssFunction {
  (...styles: SystemStyleObject[]): string
  raw: (styles: SystemStyleObject) => SystemStyleObject
}

export declare const css: CssFunction
