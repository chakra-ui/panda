/* eslint-disable */
import type { ConditionalValue } from '../types/index';
import type { DistributiveOmit, Pretty } from '../types/system-types';

interface SlotButtonVariant {
  visual: "solid" | "outline"
}

type SlotButtonVariantMap = {
  [key in keyof SlotButtonVariant]: Array<SlotButtonVariant[key]>
}

export type SlotButtonVariantProps = {
  [key in keyof SlotButtonVariant]?: ConditionalValue<SlotButtonVariant[key]> | undefined
}

export interface SlotButtonRecipe {
  __type: SlotButtonVariantProps
  (props?: SlotButtonVariantProps): Pretty<Record<"root" | "icon", string>>
  raw: (props?: SlotButtonVariantProps) => SlotButtonVariantProps
  variantMap: SlotButtonVariantMap
  variantKeys: Array<keyof SlotButtonVariant>
  splitVariantProps<Props extends SlotButtonVariantProps>(props: Props): [SlotButtonVariantProps, Pretty<DistributiveOmit<Props, keyof SlotButtonVariantProps>>]
}


export declare const slotButton: SlotButtonRecipe