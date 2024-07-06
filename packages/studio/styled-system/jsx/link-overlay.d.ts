/* eslint-disable */
import type { HTMLPandaProps } from "../types/jsx.d.ts";
import type { DistributiveOmit } from "../types/system-types.d.ts";

import type { FunctionComponent } from "react";
import type { LinkOverlayProperties } from "../patterns/link-overlay";

export interface LinkOverlayProps
  extends LinkOverlayProperties,
    DistributiveOmit<HTMLPandaProps<"a">, keyof LinkOverlayProperties> {}

export declare const LinkOverlay: FunctionComponent<LinkOverlayProps>;
