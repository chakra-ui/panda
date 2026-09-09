import { describe, expect, it } from "vitest";
import { diffSpecs } from "./diff";
import type { TokensFile } from "./tokens";

const before: TokensFile = {
  data: [
    { type: "colors", values: [{ name: "red.500", value: "#ef4444" }, { name: "blue.500", value: "#3b82f6" }] },
    { type: "spacing", values: [{ name: "4", value: "1rem" }] },
  ],
};

const after: TokensFile = {
  data: [
    // red changed, blue removed, green added
    { type: "colors", values: [{ name: "red.500", value: "#dc2626" }, { name: "green.500", value: "#22c55e" }] },
    { type: "spacing", values: [{ name: "4", value: "1rem" }] }, // unchanged
    { type: "radii", values: [{ name: "md", value: "6px" }] }, // new category
  ],
};

describe("diffSpecs", () => {
  it("reports added, removed, and changed per category", () => {
    const diff = diffSpecs(before, after);
    const colors = diff.find((d) => d.type === "colors")!;
    expect(colors.changed).toEqual([{ name: "red.500", from: "#ef4444", to: "#dc2626" }]);
    expect(colors.added).toEqual([{ name: "green.500", value: "#22c55e" }]);
    expect(colors.removed).toEqual([{ name: "blue.500", value: "#3b82f6" }]);
  });

  it("surfaces a wholly-new category as added", () => {
    const radii = diffSpecs(before, after).find((d) => d.type === "radii")!;
    expect(radii.added).toEqual([{ name: "md", value: "6px" }]);
    expect(radii.removed).toEqual([]);
  });

  it("omits unchanged categories", () => {
    expect(diffSpecs(before, after).some((d) => d.type === "spacing")).toBe(false);
  });

  it("is empty for identical specs", () => {
    expect(diffSpecs(before, before)).toEqual([]);
  });
});
