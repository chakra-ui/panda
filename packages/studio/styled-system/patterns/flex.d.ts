/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type FlexProperties = {
   align?: PropertyValue<'alignItems'>
	justify?: PropertyValue<'justifyContent'>
	direction?: PropertyValue<'flexDirection'>
	wrap?: PropertyValue<'flexWrap'>
	basis?: PropertyValue<'flexBasis'>
	grow?: PropertyValue<'flexGrow'>
	shrink?: PropertyValue<'flexShrink'>
}


type FlexStyles = FlexProperties & DistributiveOmit<SystemStyleObject, keyof FlexProperties >

interface FlexPatternFn {
  (styles?: FlexStyles): string
  raw: (styles: FlexStyles) => SystemStyleObject
}


export declare const flex: FlexPatternFn;
