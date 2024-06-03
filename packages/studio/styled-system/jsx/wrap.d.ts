/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { WrapProperties } from "../patterns/wrap";

export interface WrapProps
  extends WrapProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof WrapProperties> {}

export declare const Wrap: FunctionComponent<WrapProps>;
