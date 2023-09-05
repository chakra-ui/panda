/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type VisuallyHiddenProperties = {
   
}


type VisuallyHiddenStyles = VisuallyHiddenProperties & DistributiveOmit<SystemStyleObject, keyof VisuallyHiddenProperties >

interface VisuallyHiddenPatternFn {
  (styles?: VisuallyHiddenStyles): string
  raw: (styles?: VisuallyHiddenStyles) => SystemStyleObject
}


export declare const visuallyHidden: VisuallyHiddenPatternFn;
