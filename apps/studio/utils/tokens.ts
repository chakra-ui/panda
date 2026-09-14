import { z } from "zod";

const TokenValue = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]).transform(String),
});

const Category = z.object({
  type: z.string(),
  values: z.array(TokenValue),
});

export const TokensFile = z.object({
  data: z.array(Category).min(1, 'No token categories found in "data"'),
});

export type TokensFile = z.infer<typeof TokensFile>;
export type Category = z.infer<typeof Category>;
export type Token = z.infer<typeof TokenValue>;

export type ParseResult = { ok: true; file: TokensFile } | { ok: false; error: string };

export function parseTokens(raw: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That is not valid JSON. Check the file and try again." };
  }
  const result = TokensFile.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? ` (at ${issue.path.join(".")})` : "";
    return {
      ok: false,
      error: `Expected Panda's tokens.json shape { data: [{ type, values: [{ name, value }] }] }. ${issue.message}${where}.`,
    };
  }
  return { ok: true, file: result.data };
}

export const Renderer = z.enum([
  "colors",
  "scale",
  "fonts",
  "ramp",
  "box",
  "motion",
  "ratio",
  "blur",
  "layers",
  "screens",
  "table",
]);
export type Renderer = z.infer<typeof Renderer>;

const RENDERER_BY_TYPE: Record<string, Renderer> = {
  colors: Renderer.enum.colors,
  gradients: Renderer.enum.colors,
  spacing: Renderer.enum.scale,
  sizes: Renderer.enum.scale,
  radii: Renderer.enum.scale,
  fonts: Renderer.enum.fonts,
  fontSizes: Renderer.enum.ramp,
  lineHeights: Renderer.enum.ramp,
  letterSpacings: Renderer.enum.ramp,
  fontWeights: Renderer.enum.ramp,
  shadows: Renderer.enum.box,
  borders: Renderer.enum.box,
  durations: Renderer.enum.motion,
  easings: Renderer.enum.motion,
  animations: Renderer.enum.motion,
  aspectRatios: Renderer.enum.ratio,
  blurs: Renderer.enum.blur,
  zIndex: Renderer.enum.layers,
  breakpoints: Renderer.enum.screens,
};

export function rendererFor(type: string): Renderer {
  return RENDERER_BY_TYPE[type] ?? Renderer.enum.table;
}

export function toNumber(value: string): number {
  const match = value.match(/-?\d*\.?\d+/);
  if (!match) return Number.POSITIVE_INFINITY;
  const n = Number.parseFloat(match[0]);
  if (/rem|em/.test(value)) return n * 16;
  return n;
}
