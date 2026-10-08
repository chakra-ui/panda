import { encodeSpec } from "@pandacss/compiler-shared";
import { describe, expect, it } from "vitest";
import { readHandoff, readWatchMessage, receiveHandoff } from "./handoff";

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

describe("readWatchMessage", () => {
  const parent = {};
  const message = { type: "panda-studio:spec", json };
  const receive = (origin: string, data: unknown = message, source: unknown = parent) =>
    readWatchMessage({ origin, data, source } as MessageEvent, parent);

  it("accepts a spec from a loopback parent", () => {
    expect(receive("http://127.0.0.1:5173")).toBe(json);
    expect(receive("http://localhost:4000")).toBe(json);
  });

  it("ignores other origins", () => {
    expect(receive("https://evil.example")).toBeNull();
    expect(receive("http://127.0.0.1.evil.example:80")).toBeNull();
  });

  it("ignores messages from other windows", () => {
    expect(receive("http://127.0.0.1:5173", message, {})).toBeNull();
  });

  it("ignores other message shapes", () => {
    expect(receive("http://127.0.0.1:5173", { type: "other" })).toBeNull();
    expect(receive("http://127.0.0.1:5173", null)).toBeNull();
  });
});
