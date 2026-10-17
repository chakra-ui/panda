import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import { parseSpec } from "./design-system";
import {
  decodeSpecPayload,
  encodeSpecPayload,
  fetchSpecText,
  MAX_PAYLOAD_CHARS,
  parseSpecLink,
  pickTheme,
  resolveSpecLink,
} from "./spec-link";

const sample = readFileSync(
  new URL("../public/sample-design-system.json", import.meta.url),
  "utf8",
);
const link = (hash: string) => {
  const parsed = parseSpecLink(hash);
  if (!parsed.ok || !parsed.link) throw new Error(`expected a link for ${hash}`);
  return parsed.link;
};

describe("parseSpecLink", () => {
  it("ignores a missing or unrelated hash", () => {
    expect(parseSpecLink("")).toEqual({ ok: true, link: null });
    expect(parseSpecLink("#colors")).toEqual({ ok: true, link: null });
  });

  it("reads an encoded url and theme", () => {
    const parsed = link(
      `#url=${encodeURIComponent("https://example.com/specs/sketch.json")}&theme=midnight`,
    );
    expect(parsed.kind).toBe("url");
    expect(parsed.kind === "url" && parsed.url.href).toBe("https://example.com/specs/sketch.json");
    expect(parsed.theme).toBe("midnight");
  });

  it("allows http only on localhost and 127.0.0.1", () => {
    expect(link("#url=http%3A%2F%2Flocalhost%3A3000%2Fa.json").kind).toBe("url");
    expect(link("#url=http%3A%2F%2F127.0.0.1%3A3000%2Fa.json").kind).toBe("url");
    expect(parseSpecLink("#url=http%3A%2F%2Fexample.com%2Fa.json").ok).toBe(false);
    expect(parseSpecLink("#url=javascript%3Aalert(1)").ok).toBe(false);
    expect(parseSpecLink("#url=not-a-url").ok).toBe(false);
  });

  it("rejects url and spec together", () => {
    expect(parseSpecLink("#url=https%3A%2F%2Fexample.com%2Fa.json&spec=gz:abc").ok).toBe(false);
  });
});

describe("pickTheme", () => {
  it("keeps a theme the spec defines", () => {
    expect(pickTheme({ midnight: {} }, "midnight")).toBe("midnight");
  });

  it("falls back to the default theme", () => {
    expect(pickTheme({ midnight: {} }, "nope")).toBeUndefined();
    expect(pickTheme({}, "midnight")).toBeUndefined();
    expect(pickTheme({}, "constructor")).toBeUndefined();
    expect(pickTheme({ midnight: {} })).toBeUndefined();
  });
});

describe("decodeSpecPayload", () => {
  it("round-trips a spec that passes validation", async () => {
    const payload = await encodeSpecPayload(sample);
    const raw = await decodeSpecPayload(payload);
    expect(parseSpec(raw).ok).toBe(true);
    expect(Object.keys(JSON.parse(raw).themes)).toEqual(["midnight"]);
  });

  it("decodes payloads gzipped elsewhere", async () => {
    const payload = `gz:${gzipSync(sample).toString("base64url")}`;
    expect(await decodeSpecPayload(payload)).toBe(sample);
  });

  it("rejects an unknown or missing prefix", async () => {
    await expect(decodeSpecPayload("br:abcd")).rejects.toThrow("Unknown link format.");
    await expect(decodeSpecPayload("abcd")).rejects.toThrow("Unknown link format.");
  });

  it("rejects corrupt payloads", async () => {
    await expect(decodeSpecPayload("gz:not base64!")).rejects.toThrow("Bad encoding.");
    await expect(decodeSpecPayload("gz:aGVsbG8gd29ybGQ")).rejects.toThrow("Corrupt data.");
    const truncated = (await encodeSpecPayload(sample)).slice(0, 200);
    await expect(decodeSpecPayload(truncated)).rejects.toThrow();
  });

  it("rejects payloads over the length limit before decoding", async () => {
    await expect(decodeSpecPayload(`gz:${"A".repeat(MAX_PAYLOAD_CHARS)}`)).rejects.toThrow(
      "Too large.",
    );
  });

  it("stops a gzip bomb once the output passes the limit", async () => {
    const bomb = `gz:${gzipSync(Buffer.alloc(20 * 1024 * 1024, 32)).toString("base64url")}`;
    expect(bomb.length).toBeLessThan(MAX_PAYLOAD_CHARS);
    await expect(decodeSpecPayload(bomb)).rejects.toThrow("Too large.");
  });
});

describe("fetchSpecText", () => {
  const url = new URL("https://example.com/specs/sketch.json");

  it("makes a credential-free GET with no custom headers", async () => {
    const fetch = vi.fn(async () => new Response(sample));
    expect(await fetchSpecText(url, { fetch })).toBe(sample);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.credentials).toBe("omit");
    expect(init.method).toBeUndefined();
    expect(init.headers).toBeUndefined();
  });

  it("rejects responses that aren't OK", async () => {
    const fetch = async () => new Response("nope", { status: 404 });
    await expect(fetchSpecText(url, { fetch })).rejects.toThrow("The host answered 404.");
  });

  it("rejects a large Content-Length up front", async () => {
    const fetch = async () =>
      new Response("{}", { headers: { "content-length": String(11 * 1024 * 1024) } });
    await expect(fetchSpecText(url, { fetch })).rejects.toThrow("Too large.");
  });

  it("counts bytes when Content-Length is missing", async () => {
    const fetch = async () => new Response("x".repeat(64));
    await expect(fetchSpecText(url, { fetch, max: 32 })).rejects.toThrow("Too large.");
  });

  it("gives up after the timeout", async () => {
    const fetch = (_: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) =>
        init!.signal!.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        ),
      );
    await expect(fetchSpecText(url, { fetch, timeoutMs: 20 })).rejects.toThrow("Timed out.");
  });
});

describe("resolveSpecLink", () => {
  it("names the link type that failed", async () => {
    await expect(resolveSpecLink(link("#spec=br:abcd"))).rejects.toThrow(
      "Couldn't read the design system in this link. Unknown link format.",
    );
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(resolveSpecLink(link("#url=https%3A%2F%2Fexample.com%2Fa.json"))).rejects.toThrow(
      "Couldn't load the design system from example.com.",
    );
    vi.unstubAllGlobals();
  });
});
