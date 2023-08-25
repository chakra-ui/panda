/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/system-types';
import type { Token } from '../tokens/index';

export type LinkOverlayProperties = {
   
}


type LinkOverlayStyles = LinkOverlayProperties & DistributiveOmit<SystemStyleObject, keyof LinkOverlayProperties >

interface LinkOverlayPatternFn {
  (styles?: LinkOverlayStyles): string
  raw: (styles: LinkOverlayStyles) => SystemStyleObject
}


export declare const linkOverlay: LinkOverlayPatternFn;
