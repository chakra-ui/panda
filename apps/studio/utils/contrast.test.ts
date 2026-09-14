import { describe, expect, it } from "vitest";
import { contrastRatio, parseColor, wcagLevel } from "./contrast";

describe("parseColor", () => {
  it("parses shorthand and full hex", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("#ef4444")).toEqual({ r: 239, g: 68, b: 68 });
  });
  it("parses rgb/rgba", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 });
    expect(parseColor("rgba(10 20 30 / 0.5)")).toEqual({ r: 10, g: 20, b: 30 });
  });
  it("returns null for forms it can't parse", () => {
    expect(parseColor("hsl(0 0% 0%)")).toBeNull();
    expect(parseColor("rebeccapurple")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("black on white is 21:1, symmetric", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
  });
  it("same color is 1:1", () => {
    expect(contrastRatio("#777", "#777")).toBeCloseTo(1, 5);
  });
  it("is null when a color is unparseable", () => {
    expect(contrastRatio("#000", "hsl(0 0% 100%)")).toBeNull();
  });
});

describe("wcagLevel", () => {
  it("maps ratios to WCAG thresholds", () => {
    expect(wcagLevel(21)).toBe("AAA");
    expect(wcagLevel(5)).toBe("AA");
    expect(wcagLevel(3.5)).toBe("AA Large");
    expect(wcagLevel(2)).toBe("Fail");
  });
});
