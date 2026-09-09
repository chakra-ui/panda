import { describe, expect, it } from "vitest";
import { decodeSpec, encodeSpec, SHARE_VERSION, type SharePayload } from "./share";

const payload: SharePayload = {
  v: SHARE_VERSION,
  tokens: {
    data: [
      { type: "colors", values: [{ name: "red.500", value: "#ef4444" }] },
      { type: "spacing", values: [{ name: "4", value: "1rem" }] },
    ],
  },
  css: '[data-theme="dark"]{--colors-red-500:#f87171}',
};

describe("share codec", () => {
  it("round-trips a payload", async () => {
    expect(await decodeSpec(await encodeSpec(payload))).toEqual(payload);
  });

  it("emits url-safe base64 (no +, /, or =)", async () => {
    expect(await encodeSpec(payload)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("compresses — the code is smaller than the raw JSON", async () => {
    const raw = JSON.stringify(payload).length;
    expect((await encodeSpec(payload)).length).toBeLessThan(raw);
  });

  it("rejects a corrupted code", async () => {
    await expect(decodeSpec("not-a-real-deflate-stream")).rejects.toThrow();
  });
});
