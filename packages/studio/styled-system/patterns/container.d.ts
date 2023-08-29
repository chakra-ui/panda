/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type ContainerProperties = {
   
}


type ContainerStyles = ContainerProperties & DistributiveOmit<SystemStyleObject, keyof ContainerProperties >

interface ContainerPatternFn {
  (styles?: ContainerStyles): string
  raw: (styles: ContainerStyles) => SystemStyleObject
}


export declare const container: ContainerPatternFn;
