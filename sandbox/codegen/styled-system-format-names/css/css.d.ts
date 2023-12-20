/* eslint-disable */
import type { SystemStyleObject } from '../types/index';

interface CssFunction {
  (...styles: Array<SystemStyleObject | undefined | null | false>): string
  raw: (...styles: Array<SystemStyleObject | undefined | null | false>) => SystemStyleObject
}

export declare const css: CssFunction;