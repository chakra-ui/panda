import { describe, expect, it } from "vitest";
import { extractTokenLayer } from "./token-css";

describe("extractTokenLayer", () => {
  it("extracts the @layer tokens block with balanced braces", () => {
    const css = `@layer reset{a{color:red}}
@layer tokens{:where(:root,:host){--colors-amber-1:#fffcfb;--spacing-4:1rem}}
@layer utilities{.p_4{padding:1rem}}`;
    const out = extractTokenLayer(css);
    expect(out).toContain("--colors-amber-1:#fffcfb");
    expect(out).toContain("--spacing-4:1rem");
    expect(out?.startsWith("@layer tokens {")).toBe(true);
    expect(out).not.toContain(".p_4");
  });

  it("returns null when the tokens layer has no color vars", () => {
    expect(extractTokenLayer("@layer tokens{:root{--spacing-4:1rem}}")).toBeNull();
  });

  it("returns null when there is no tokens layer", () => {
    expect(extractTokenLayer(".p_4{padding:1rem}")).toBeNull();
  });
});
