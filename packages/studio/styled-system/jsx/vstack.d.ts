/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { VstackProperties } from "../patterns/vstack";

export interface VstackProps
  extends VstackProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof VstackProperties> {}

export declare const VStack: FunctionComponent<VstackProps>;
