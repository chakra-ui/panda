import {
  indexDesignSystem,
  parseDesignSystem,
  type DesignSystemIndex,
  type DesignSystemSpec,
  type TokenView,
} from "@pandacss/compiler-shared";

export type { DesignSystemIndex, DesignSystemSpec, TokenView };

export type ParseResult = { ok: true; spec: DesignSystemSpec } | { ok: false; error: string };

export function parseSpec(raw: string): ParseResult {
  const result = parseDesignSystem(raw);
  if (!result.ok) {
    return {
      ok: false,
      error: `${result.error} Drop the styled-system/specs/design-system.json that panda codegen writes.`,
    };
  }
  if (!result.value.paths.length) {
    return { ok: false, error: "That design system has no tokens." };
  }
  return { ok: true, spec: result.value };
}

export const index = indexDesignSystem;

/** Themes the system defines. An exclusive choice, so a select fits. */
export function themeNames(ds: DesignSystemIndex): string[] {
  return Object.keys(ds.spec.themes);
}

/** How to draw a category. Purely a studio concern — not part of the spec. */
export type Renderer =
  | "colors"
  | "scale"
  | "fonts"
  | "ramp"
  | "box"
  | "motion"
  | "ratio"
  | "blur"
  | "layers"
  | "screens"
  | "table";

const RENDERER_BY_CATEGORY: Record<string, Renderer> = {
  colors: "colors",
  gradients: "colors",
  spacing: "scale",
  sizes: "scale",
  radii: "scale",
  fonts: "fonts",
  fontSizes: "ramp",
  lineHeights: "ramp",
  letterSpacings: "ramp",
  fontWeights: "ramp",
  shadows: "box",
  borders: "box",
  durations: "motion",
  easings: "motion",
  animations: "motion",
  aspectRatios: "ratio",
  blurs: "blur",
  zIndex: "layers",
  breakpoints: "screens",
};

export function rendererFor(category: string): Renderer {
  return RENDERER_BY_CATEGORY[category] ?? "table";
}

/** Numeric ordering for scales, where `4` must precede `10`. */
export function toNumber(value: string): number {
  const match = value.match(/-?\d*\.?\d+/);
  if (!match) return Number.POSITIVE_INFINITY;
  const n = Number.parseFloat(match[0]);
  if (/rem|em/.test(value)) return n * 16;
  return n;
}

/** Categories whose tokens only read against real copy, and the copy to use. */
export const PREVIEW_TEXT: Record<string, string> = {
  fonts: "The quick brown fox jumps over the lazy dog",
  fontSizes: "Hello World",
  fontWeights: "Hello World",
  // Tracking only reads across a full alphabet.
  letterSpacings: "The quick brown fox jumps over the lazy dog.",
  // Leading is invisible on a single line.
  lineHeights:
    "Line height sets the vertical distance between lines of text. It only shows itself across a few lines, so this paragraph runs on a while to give it room.",
};

export const hasPreview = (category: string) => category in PREVIEW_TEXT;

/** Leading needs several lines, so it gets a textarea rather than an input. */
export const wantsLargePreview = (category: string) => category === "lineHeights";
