/* eslint-disable */
import type { SystemStyleObject } from '../types/index';

interface CssFunction {
  (...styles: Array<SystemStyleObject | undefined | null | false>): string
  raw: (styles: SystemStyleObject) => SystemStyleObject
}

export declare const css: CssFunction;