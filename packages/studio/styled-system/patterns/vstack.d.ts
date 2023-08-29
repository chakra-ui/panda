/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type VstackProperties = {
   justify?: PropertyValue<'justifyContent'>
	gap?: PropertyValue<'gap'>
}


type VstackStyles = VstackProperties & DistributiveOmit<SystemStyleObject, keyof VstackProperties >

interface VstackPatternFn {
  (styles?: VstackStyles): string
  raw: (styles: VstackStyles) => SystemStyleObject
}


export declare const vstack: VstackPatternFn;
