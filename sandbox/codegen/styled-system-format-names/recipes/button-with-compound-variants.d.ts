/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface ButtonWithCompoundVariantsVariant {
  visual: "solid" | "outline"
size: "sm" | "md" | "lg"
}

type ButtonWithCompoundVariantsVariantMap = {
  [key in keyof ButtonWithCompoundVariantsVariant]: Array<ButtonWithCompoundVariantsVariant[key]>
}

export type ButtonWithCompoundVariantsVariantProps = {
  [key in keyof ButtonWithCompoundVariantsVariant]?: ButtonWithCompoundVariantsVariant[key] | undefined
}

export interface ButtonWithCompoundVariantsRecipe {
  __type: ButtonWithCompoundVariantsVariantProps
  (props?: ButtonWithCompoundVariantsVariantProps): string
  raw: (props?: ButtonWithCompoundVariantsVariantProps) => ButtonWithCompoundVariantsVariantProps
  variantMap: ButtonWithCompoundVariantsVariantMap
  variantKeys: Array<keyof ButtonWithCompoundVariantsVariant>
  splitVariantProps<Props extends ButtonWithCompoundVariantsVariantProps>(props: Props): [ButtonWithCompoundVariantsVariantProps, Pretty<DistributiveOmit<Props, keyof ButtonWithCompoundVariantsVariantProps>>]
}

/** The styles for the Button component */
export declare const buttonWithCompoundVariants: ButtonWithCompoundVariantsRecipe