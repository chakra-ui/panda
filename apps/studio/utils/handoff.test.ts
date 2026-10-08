import { encodeSpec } from "@pandacss/compiler-shared";
import { describe, expect, it } from "vitest";
import { readHandoff, receiveHandoff } from "./handoff";

const json = JSON.stringify({ schemaVersion: 1, paths: ["colors.brand"] });

describe("readHandoff", () => {
  it("reads the spec from the fragment", () => {
    expect(readHandoff({ hash: "#spec=abc" })).toBe("abc");
  });

  it("returns null without a spec", () => {
    expect(readHandoff({ hash: "" })).toBeNull();
  });
});

describe("receiveHandoff", () => {
  it("decodes the spec", async () => {
    expect(await receiveHandoff(await encodeSpec(json))).toBe(json);
  });

  it("returns null for a cut-off link", async () => {
    const encoded = await encodeSpec(json);
    expect(await receiveHandoff(encoded.slice(0, 10))).toBeNull();
  });
});
