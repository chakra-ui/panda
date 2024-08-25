/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { ContainerProperties } from "../patterns/container";

export interface ContainerProps
  extends ContainerProperties,
    DistributiveOmit<HTMLPandaProps<"div">, keyof ContainerProperties> {}

export declare const Container: FunctionComponent<ContainerProps>;
