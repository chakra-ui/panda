/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Tokens } from '../tokens/index';

export type AspectRatioProperties = {
   ratio?: ConditionalValue<number>
}


type AspectRatioStyles = AspectRatioProperties & DistributiveOmit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'>

interface AspectRatioPatternFn {
  (styles?: AspectRatioStyles): string
  raw: (styles: AspectRatioStyles) => SystemStyleObject
}


export declare const aspectRatio: AspectRatioPatternFn;
