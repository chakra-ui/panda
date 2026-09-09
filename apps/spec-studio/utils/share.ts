import { TokensFile } from "~/utils/tokens";
import { z } from "zod";

export const SHARE_VERSION = 1;

export const SharePayload = z.object({
  v: z.literal(SHARE_VERSION),
  tokens: TokensFile,
  css: z.string().nullable().default(null),
  usage: z.unknown().optional(),
});

export type SharePayload = z.infer<typeof SharePayload>;

async function pipe(bytes: Uint8Array, stream: TransformStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let b64: string;
  if (typeof Buffer !== "undefined") b64 = Buffer.from(bytes).toString("base64");
  else b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): Uint8Array {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function encodeSpec(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(SharePayload.parse(payload)));
  return toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

export async function decodeSpec(code: string): Promise<SharePayload> {
  const bytes = await pipe(fromBase64Url(code), new DecompressionStream("deflate-raw"));
  return SharePayload.parse(JSON.parse(new TextDecoder().decode(bytes)));
}
