/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type WrapProperties = {
   gap?: PropertyValue<'gap'>
	rowGap?: PropertyValue<'gap'>
	columnGap?: PropertyValue<'gap'>
	align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
}


type WrapStyles = WrapProperties & DistributiveOmit<SystemStyleObject, keyof WrapProperties >

interface WrapPatternFn {
  (styles?: WrapStyles): string
  raw: (styles: WrapStyles) => SystemStyleObject
}


export declare const wrap: WrapPatternFn;
