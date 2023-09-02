/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type BoxProperties = {
   
}


type BoxStyles = BoxProperties & DistributiveOmit<SystemStyleObject, keyof BoxProperties >

interface BoxPatternFn {
  (styles?: BoxStyles): string
  raw: (styles: BoxStyles) => SystemStyleObject
}


export declare const box: BoxPatternFn;
