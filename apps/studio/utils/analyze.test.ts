import { describe, expect, it } from "vitest";
import { analyzeUsage, isIgnoredPath, type Source } from "./analyze";
import { index, type DesignSystemSpec } from "./design-system";

const spec = (category: string, names: string[]): DesignSystemSpec => ({
  schemaVersion: 1,
  categories: { [category]: [0, names.length] },
  paths: names.map((n) => `${category}.${n}`),
  tokens: Object.fromEntries(names.map((n) => [`${category}.${n}`, { category }])),
  conditions: {},
  themes: {},
  values: names.map((n) => ({ token: `${category}.${n}`, value: n })),
});

describe("analyzeUsage", () => {
  const sources: Source[] = [
    { name: "a.vue", text: "css({ color: 'red.500', bg: 'red.500' })" },
    { name: "b.ts", text: "const x = token('colors.blue.500')" },
  ];
  const ds = index(spec("colors", ["red.500", "blue.500", "green.500"]));
  const [colors] = analyzeUsage(ds, sources);
  const byName = Object.fromEntries(colors!.tokens.map((t) => [t.name, t.uses]));

  it("counts repeated and category-prefixed references", () => {
    expect(byName["red.500"]).toBe(2);
    expect(byName["blue.500"]).toBe(1);
    expect(byName["green.500"]).toBe(0);
  });

  it("computes used / unused / percent per category", () => {
    expect(colors!.used).toBe(2);
    expect(colors!.unused).toBe(1);
    expect(colors!.percent).toBe(67);
  });

  it("sorts unused tokens last", () => {
    expect(colors!.tokens.at(-1)?.name).toBe("green.500");
  });

  it("does not match a bare-numeric token inside hyphenated identifiers", () => {
    const ds = index(spec("spacing", ["4"]));
    const [cat] = analyzeUsage(ds, [{ name: "c.ts", text: "size-4 p-4 padding: '4'" }]);
    expect(cat!.tokens[0]!.uses).toBe(1);
  });
});

describe("isIgnoredPath", () => {
  it("ignores generated styled-system output", () => {
    expect(isIgnoredPath("styled-system/css/index.mjs")).toBe(true);
  });

  it("ignores installed dependencies", () => {
    expect(isIgnoredPath("node_modules/x/y.js")).toBe(true);
  });

  it("ignores build output", () => {
    expect(isIgnoredPath("app/dist/out.js")).toBe(true);
  });

  it("ignores version control metadata", () => {
    expect(isIgnoredPath(".git/HEAD")).toBe(true);
  });

  it("keeps component source", () => {
    expect(isIgnoredPath("src/Button.vue")).toBe(false);
  });

  it("keeps the panda config", () => {
    expect(isIgnoredPath("panda.config.ts")).toBe(false);
  });
});
