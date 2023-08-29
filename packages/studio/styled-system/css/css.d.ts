/* eslint-disable */
import type { SystemStyleObject } from '../types/index';

interface CssFunction {
  (...styles: SystemStyleObject[]): string
  raw: (styles: SystemStyleObject) => SystemStyleObject
}

export declare const css: CssFunction;