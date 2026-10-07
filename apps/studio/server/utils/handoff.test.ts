import { describe, expect, it } from "vitest";
import { MAX_HANDOFF_DATA, memoryRedis, parseSealed, putHandoff, takeHandoff } from "./handoff";

const sealed = { iv: "aaaaaaaaaaaaaaaa", data: "bbbb-cccc_dddd" };

describe("handoff", () => {
  it("accepts a sealed payload", () => {
    expect(parseSealed(sealed)).toEqual(sealed);
  });

  it("rejects anything else", () => {
    for (const body of [null, "x", {}, { iv: "a" }, { iv: "a", data: "b c" }, { iv: 1, data: "b" }]) {
      expect(parseSealed(body)).toBe("invalid");
    }
  });

  it("rejects oversized data", () => {
    expect(parseSealed({ iv: "a", data: "a".repeat(MAX_HANDOFF_DATA + 1) })).toBe("too-large");
  });

  it("returns a stored payload once", async () => {
    const redis = memoryRedis();
    const id = await putHandoff(redis, sealed);
    expect(id).toMatch(/^[\w-]{16}$/);
    expect(await takeHandoff(redis, id)).toEqual(sealed);
    expect(await takeHandoff(redis, id)).toBeNull();
  });

  it("expires after the ttl", async () => {
    let now = 0;
    const redis = memoryRedis(() => now);
    const id = await putHandoff(redis, sealed);
    now = 121_000;
    expect(await takeHandoff(redis, id)).toBeNull();
  });

  it("ignores malformed ids", async () => {
    expect(await takeHandoff(memoryRedis(), "../../etc")).toBeNull();
  });
});
