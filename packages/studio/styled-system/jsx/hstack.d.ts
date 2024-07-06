/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { HstackProperties } from "../patterns/hstack";

export interface HstackProps
  extends HstackProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof HstackProperties> {}

export declare const HStack: FunctionComponent<HstackProps>;
