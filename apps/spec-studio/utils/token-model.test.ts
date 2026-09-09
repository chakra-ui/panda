import { describe, expect, it } from "vitest";
import { buildThemeLayer, discoverVariants, isSemantic } from "./token-model";

describe("discoverVariants", () => {
  it("returns just base when there is no css", () => {
    expect(discoverVariants(null).map((v) => v.id)).toEqual(["base"]);
  });

  it("finds class- and attr-based variants, skips :root and media", () => {
    const css = `@layer tokens {
      :where(:root, :host) { --colors-primary: #111 }
      .dark { --colors-primary: #eee }
      [data-panda-theme="brandX"] { --colors-primary: #f0f }
      @media (prefers-color-scheme: dark) { :root { --colors-x: #000 } }
    }`;
    const v = discoverVariants(css);
    expect(v.map((x) => x.label)).toEqual(["Base", "Dark", "BrandX"]);
    expect(v[1].class).toBe("dark");
    expect(v[2].attrs).toEqual({ "data-panda-theme": "brandX" });
  });

  it("dedupes repeated selectors", () => {
    const css = `.dark { --a: 1 } .dark { --b: 2 }`;
    expect(discoverVariants(css).filter((x) => x.id !== "base")).toHaveLength(1);
  });
});

describe("buildThemeLayer", () => {
  it("clones @media prefers-color-scheme dark into a forced attr variant", () => {
    const css = `:where(:root,:host){--colors-fg:#111}
@media (prefers-color-scheme: dark){:where(:root,:host){--colors-fg:#eee}}`;
    const { css: out, variants } = buildThemeLayer(css);
    expect(variants.map((v) => v.label)).toEqual(["Base", "Dark"]);
    expect(variants[1].attrs).toEqual({ "data-spec-scheme": "dark" });
    expect(out).toContain('[data-spec-scheme="dark"]{--colors-fg:#eee}');
  });

  it("does not add a system-dark variant when a class-based dark already exists", () => {
    const css = `.dark{--colors-fg:#eee}
@media (prefers-color-scheme: dark){:root{--colors-fg:#ccc}}`;
    const { variants } = buildThemeLayer(css);
    expect(variants.filter((v) => v.id === "sys-dark")).toHaveLength(0);
  });
});

describe("isSemantic", () => {
  it("flags var() references", () => {
    expect(isSemantic("var(--colors-brand)")).toBe(true);
    expect(isSemantic("#6d28d9")).toBe(false);
  });
});
