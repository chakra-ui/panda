/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export interface BleedProperties {
   inline?: PropertyValue<'marginInline'>
	block?: PropertyValue<'marginBlock'>
}


interface BleedStyles extends BleedProperties, DistributiveOmit<SystemStyleObject, keyof BleedProperties > {}

interface BleedPatternFn {
  (styles?: BleedStyles): string
  raw: (styles?: BleedStyles) => SystemStyleObject
}


export declare const bleed: BleedPatternFn;
