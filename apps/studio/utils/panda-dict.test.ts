import { describe, expect, it } from "vitest";
import { parseTokenDict } from "./panda-dict";

describe("parseTokenDict", () => {
  it("parses v2 string-valued dictionaries", () => {
    const src = `const tokens = {"colors.red.500":"#f00","spacing.4":"1rem","colors.colorPalette.500":""}\nexport const token = 1`;
    const file = parseTokenDict(src);
    expect(file).not.toBeNull();
    const colors = file!.data.find((c) => c.type === "colors");
    expect(colors?.values).toEqual([{ name: "red.500", value: "#f00" }]);
    expect(file!.data.find((c) => c.type === "spacing")?.values[0].value).toBe("1rem");
  });

  it("parses v1 {value,variable} dictionaries", () => {
    const src = `const tokens = {\n"radii.md": { "value": "0.375rem", "variable": "var(--radii-md)" }\n}\nexport {}`;
    const file = parseTokenDict(src);
    expect(file!.data).toEqual([{ type: "radii", values: [{ name: "md", value: "0.375rem" }] }]);
  });

  it("returns null when there is no token dictionary", () => {
    expect(parseTokenDict("export const foo = 1")).toBeNull();
  });
});
