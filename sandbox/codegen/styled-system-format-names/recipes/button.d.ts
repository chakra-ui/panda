/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface ButtonVariant {
  visual: "solid" | "outline"
}

type ButtonVariantMap = {
  [key in keyof ButtonVariant]: Array<ButtonVariant[key]>
}

export type ButtonVariantProps = {
  [key in keyof ButtonVariant]?: ConditionalValue<ButtonVariant[key]> | undefined
}

export interface ButtonRecipe {
  __type: ButtonVariantProps
  (props?: ButtonVariantProps): string
  raw: (props?: ButtonVariantProps) => ButtonVariantProps
  variantMap: ButtonVariantMap
  variantKeys: Array<keyof ButtonVariant>
  splitVariantProps<Props extends ButtonVariantProps>(props: Props): [ButtonVariantProps, Pretty<DistributiveOmit<Props, keyof ButtonVariantProps>>]
}

/** The styles for the Button component */
export declare const button: ButtonRecipe