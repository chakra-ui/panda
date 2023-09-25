/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index';
import type { Properties } from '../types/csstype';
import type { PropertyValue } from '../types/prop-type';
import type { DistributiveOmit } from '../types/helpers';
import type { Tokens } from '../tokens/index';

export interface StyledLinkProperties {
   
}


interface StyledLinkStyles extends StyledLinkProperties, DistributiveOmit<SystemStyleObject, keyof StyledLinkProperties > {}

interface StyledLinkPatternFn {
  (styles?: StyledLinkStyles): string
  raw: (styles?: StyledLinkStyles) => SystemStyleObject
}


export declare const styledLink: StyledLinkPatternFn;
