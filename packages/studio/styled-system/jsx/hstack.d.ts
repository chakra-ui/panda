/* eslint-disable */
import { HTMLPandaProps } from "../types/jsx.mjs";
import { DistributiveOmit } from "../types/system-types.mjs";

import type { FunctionComponent } from "react";
import type { HstackProperties } from "../patterns/hstack";

export interface HstackProps
  extends HstackProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof HstackProperties> {}

export declare const HStack: FunctionComponent<HstackProps>;
