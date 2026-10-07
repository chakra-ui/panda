import { sealSpec } from "@pandacss/compiler-shared";
import { describe, expect, it } from "vitest";
import { readHandoff, receiveHandoff } from "./handoff";

const json = JSON.stringify({ schemaVersion: 1, paths: ["colors.brand"] });
const respond = (status: number, body?: unknown) => async () => new Response(JSON.stringify(body ?? {}), { status });

describe("readHandoff", () => {
  it("reads the id from the query and the key from the fragment", () => {
    expect(readHandoff({ search: "?h=abc", hash: "#k=xyz" })).toEqual({ id: "abc", key: "xyz" });
  });

  it("needs both", () => {
    expect(readHandoff({ search: "?h=abc", hash: "" })).toBeNull();
    expect(readHandoff({ search: "", hash: "#k=xyz" })).toBeNull();
  });
});

describe("receiveHandoff", () => {
  it("decrypts the stored spec", async () => {
    const { sealed, key } = await sealSpec(json);
    expect(await receiveHandoff("abc", key, respond(200, sealed))).toBe(json);
  });

  it("returns null when the handoff is gone", async () => {
    expect(await receiveHandoff("abc", "xyz", respond(404))).toBeNull();
  });

  it("returns null for the wrong key", async () => {
    const { sealed } = await sealSpec(json);
    const { key } = await sealSpec(json);
    expect(await receiveHandoff("abc", key, respond(200, sealed))).toBeNull();
  });
});
