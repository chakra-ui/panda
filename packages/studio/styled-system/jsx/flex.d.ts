/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { FlexProperties } from "../patterns/flex";

export interface FlexProps
  extends FlexProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof FlexProperties> {}

export declare const Flex: FunctionComponent<FlexProps>;
