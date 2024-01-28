/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export interface CqProperties {
   name?: ConditionalValue<Tokens["containerNames"] | Properties["containerName"]>
	type?: PropertyValue<'containerType'>
}


interface CqStyles extends CqProperties, DistributiveOmit<SystemStyleObject, keyof CqProperties > {}

interface CqPatternFn {
  (styles?: CqStyles): string
  raw: (styles?: CqStyles) => SystemStyleObject
}


export declare const cq: CqPatternFn;
