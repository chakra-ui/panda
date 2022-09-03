
import { UserConditionalValue as ConditionalValue } from "../types/public"

export type TextStyleValue = {
  size?: ConditionalValue<"h1" | "h2">
}

export declare function textStyle(value: TextStyleValue): string