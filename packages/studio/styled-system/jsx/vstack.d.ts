/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { VstackProperties } from "../patterns/vstack";

export interface VstackProps
  extends VstackProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof VstackProperties> {}

export declare const VStack: FunctionComponent<VstackProps>;
