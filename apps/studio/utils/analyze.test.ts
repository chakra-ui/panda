import { describe, expect, it } from "vitest";
import { analyzeUsage, isIgnoredPath, type Source } from "./analyze";
import type { TokensFile } from "./tokens";

const colorsFile: TokensFile = {
  data: [
    {
      type: "colors",
      values: [
        { name: "red.500", value: "#ef4444" },
        { name: "blue.500", value: "#3b82f6" },
        { name: "green.500", value: "#22c55e" },
      ],
    },
  ],
};

describe("analyzeUsage", () => {
  const sources: Source[] = [
    { name: "a.vue", text: "css({ color: 'red.500', bg: 'red.500' })" },
    { name: "b.ts", text: "const x = token('colors.blue.500')" },
  ];
  const [colors] = analyzeUsage(colorsFile, sources);
  const byName = Object.fromEntries(colors.tokens.map((t) => [t.name, t.uses]));

  it("counts repeated and category-prefixed references", () => {
    expect(byName["red.500"]).toBe(2);
    expect(byName["blue.500"]).toBe(1);
    expect(byName["green.500"]).toBe(0);
  });

  it("computes used / unused / percent per category", () => {
    expect(colors.used).toBe(2);
    expect(colors.unused).toBe(1);
    expect(colors.percent).toBe(67);
  });

  it("sorts unused tokens last", () => {
    expect(colors.tokens.at(-1)?.name).toBe("green.500");
  });

  it("does not match a bare-numeric token inside hyphenated identifiers", () => {
    const spacing: TokensFile = {
      data: [{ type: "spacing", values: [{ name: "4", value: "1rem" }] }],
    };
    const [cat] = analyzeUsage(spacing, [{ name: "c.ts", text: "size-4 p-4 padding: '4'" }]);
    expect(cat.tokens[0].uses).toBe(1);
  });
});

describe("isIgnoredPath", () => {
  it.each(["styled-system/css/index.mjs", "node_modules/x/y.js", "app/dist/out.js", ".git/HEAD"])(
    "ignores build output and deps: %s",
    (p) => expect(isIgnoredPath(p)).toBe(true),
  );

  it.each(["src/Button.vue", "app/pages/index.vue", "panda.config.ts"])(
    "keeps app source: %s",
    (p) => expect(isIgnoredPath(p)).toBe(false),
  );
});
