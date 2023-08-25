/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type HstackProperties = {
   justify?: PropertyValue<'justifyContent'>
	gap?: PropertyValue<'gap'>
}


type HstackStyles = HstackProperties & DistributiveOmit<SystemStyleObject, keyof HstackProperties >

interface HstackPatternFn {
  (styles?: HstackStyles): string
  raw: (styles: HstackStyles) => SystemStyleObject
}


export declare const hstack: HstackPatternFn;
